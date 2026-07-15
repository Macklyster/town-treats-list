
-- 1. Enum de status
DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('pending','approved','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Novos campos em events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS category_slug text,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS price_info text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status public.event_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_token text DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Preenche slug para linhas existentes
UPDATE public.events
SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL;

UPDATE public.events SET share_token = replace(gen_random_uuid()::text, '-', '')
WHERE share_token IS NULL;

ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN share_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_uidx ON public.events(slug);
CREATE UNIQUE INDEX IF NOT EXISTS events_share_token_uidx ON public.events(share_token);
CREATE INDEX IF NOT EXISTS events_status_starts_idx ON public.events(status, starts_at);
CREATE INDEX IF NOT EXISTS events_store_idx ON public.events(store_id);

-- 3. app_settings: limite por loja
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS event_max_active_per_store integer NOT NULL DEFAULT 3;

-- 4. notification_preferences: flag events
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS events boolean NOT NULL DEFAULT true;

-- 5. Trigger de updated_at
DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Validação
CREATE OR REPLACE FUNCTION public.validate_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_is_premium boolean;
  v_count int;
  v_max int;
BEGIN
  IF NEW.title IS NULL OR length(trim(NEW.title)) < 3 OR length(NEW.title) > 120 THEN
    RAISE EXCEPTION 'title must be 3-120 chars';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'description exceeds 2000 chars';
  END IF;
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'ends_at must be greater than starts_at';
  END IF;

  IF NEW.slug IS NULL OR length(NEW.slug) < 3 THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 6);
  END IF;

  -- Plano: Destaque ou Plus (admin ignora)
  IF (TG_OP = 'INSERT')
     OR (NEW.status IN ('pending','approved') AND TG_OP='UPDATE' AND OLD.status NOT IN ('pending','approved')) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions sub
      JOIN public.plans p ON p.id = sub.plan_id
      WHERE sub.store_id = NEW.store_id
        AND sub.status IN ('active','trialing')
        AND p.slug IN ('destaque','plus')
    ) INTO v_is_premium;
    IF NOT v_is_premium AND NOT public.has_role(auth.uid(),'admin') THEN
      RAISE EXCEPTION 'events are exclusive to Destaque and Plus plans';
    END IF;

    SELECT COALESCE(event_max_active_per_store, 3) INTO v_max FROM public.app_settings WHERE id = true;
    SELECT count(*) INTO v_count FROM public.events
      WHERE store_id = NEW.store_id
        AND status IN ('pending','approved')
        AND (NEW.id IS NULL OR id <> NEW.id);
    IF v_count >= v_max THEN
      RAISE EXCEPTION 'store reached the maximum active events limit (%)', v_max;
    END IF;
  END IF;

  -- Marca approved_at
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status <> 'approved') THEN
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_event ON public.events;
CREATE TRIGGER trg_validate_event
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.validate_event();

-- 7. RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events owner write" ON public.events;
DROP POLICY IF EXISTS "events public read" ON public.events;

CREATE POLICY "events public read approved"
ON public.events FOR SELECT
USING (
  status = 'approved'
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = events.store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "events store owner insert"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "events store owner update"
ON public.events FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = events.store_id AND s.owner_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = events.store_id AND s.owner_id = auth.uid())
);

CREATE POLICY "events store owner delete"
ON public.events FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = events.store_id AND s.owner_id = auth.uid())
);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

-- 8. RPCs
CREATE OR REPLACE FUNCTION public.event_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.events; v_store jsonb;
BEGIN
  SELECT * INTO v_row FROM public.events WHERE slug = p_slug;
  IF v_row.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  IF v_row.status <> 'approved'
     AND NOT public.has_role(auth.uid(),'admin')
     AND NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_row.store_id AND s.owner_id = auth.uid()) THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  SELECT jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'logo_url', s.logo_url,
    'whatsapp', s.whatsapp, 'phone', s.phone, 'city', s.city, 'state', s.state)
  INTO v_store FROM public.stores s WHERE s.id = v_row.store_id;
  RETURN jsonb_build_object('found', true, 'event', to_jsonb(v_row), 'store', v_store);
END $$;

CREATE OR REPLACE FUNCTION public.event_track_view(p_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ UPDATE public.events SET view_count = view_count + 1 WHERE id = p_id AND status = 'approved'; $$;

CREATE OR REPLACE FUNCTION public.approve_event(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.events SET status='approved', rejection_reason=NULL WHERE id = p_id;
END $$;

CREATE OR REPLACE FUNCTION public.reject_event(p_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.events SET status='rejected', rejection_reason=p_reason WHERE id = p_id;
END $$;

REVOKE ALL ON FUNCTION public.event_by_slug(text) FROM public;
GRANT EXECUTE ON FUNCTION public.event_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.event_track_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_event(uuid, text) TO authenticated;
