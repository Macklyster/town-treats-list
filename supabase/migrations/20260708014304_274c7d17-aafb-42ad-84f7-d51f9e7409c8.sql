
-- Aurora Home: events, interests, view history, flyscore

CREATE TYPE public.event_kind AS ENUM ('happy_hour','show','feira','evento','promocao');

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  kind public.event_kind NOT NULL DEFAULT 'evento',
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_city_time_idx ON public.events (city, starts_at, ends_at);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events owner write" ON public.events FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = events.store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = events.store_id AND s.owner_id = auth.uid())
  );

CREATE TABLE public.user_interests (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;
GRANT ALL ON public.user_interests TO service_role;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interests" ON public.user_interests FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.user_view_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  city TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_view_history_user_time_idx ON public.user_view_history (user_id, viewed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_view_history TO authenticated;
GRANT ALL ON public.user_view_history TO service_role;
ALTER TABLE public.user_view_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own history" ON public.user_view_history FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.company_flyscore (
  store_id UUID NOT NULL PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  overall NUMERIC NOT NULL DEFAULT 0,
  pilares JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_flyscore TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_flyscore TO authenticated;
GRANT ALL ON public.company_flyscore TO service_role;
ALTER TABLE public.company_flyscore ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flyscore public read" ON public.company_flyscore FOR SELECT USING (true);
CREATE POLICY "flyscore admin write" ON public.company_flyscore FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
