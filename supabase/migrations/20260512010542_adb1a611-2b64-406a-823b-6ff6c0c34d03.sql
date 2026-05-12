-- 1. Singleton settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  flash_default_hours integer NOT NULL DEFAULT 2 CHECK (flash_default_hours BETWEEN 1 AND 168),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id, flash_default_hours) VALUES (true, 2)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings public read"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "admins manage app_settings"
  ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Flash offer columns
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS is_flash boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flash_duration_hours integer,
  ADD COLUMN IF NOT EXISTS flash_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS flash_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_offers_flash_ends_at
  ON public.offers (flash_ends_at)
  WHERE is_flash = true;

-- 3. Trigger to set flash window automatically
CREATE OR REPLACE FUNCTION public.set_flash_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_default int;
BEGIN
  IF NEW.is_flash THEN
    -- ensure duration set
    IF NEW.flash_duration_hours IS NULL OR NEW.flash_duration_hours < 1 THEN
      SELECT flash_default_hours INTO v_default FROM public.app_settings WHERE id = true;
      NEW.flash_duration_hours := COALESCE(v_default, 2);
    END IF;

    -- start window when offer becomes approved
    IF NEW.status = 'approved' THEN
      IF NEW.flash_starts_at IS NULL OR (TG_OP = 'UPDATE' AND OLD.status <> 'approved') THEN
        NEW.flash_starts_at := now();
      END IF;
      NEW.flash_ends_at := NEW.flash_starts_at + make_interval(hours => NEW.flash_duration_hours);
    END IF;
  ELSE
    NEW.flash_starts_at := NULL;
    NEW.flash_ends_at := NULL;
    NEW.flash_duration_hours := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_flash_window ON public.offers;
CREATE TRIGGER trg_set_flash_window
BEFORE INSERT OR UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.set_flash_window();