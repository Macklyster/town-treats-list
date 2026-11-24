CREATE TABLE public.seo_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('store','category','offer','group_offer','auction','geo_offer','event')),
  entity_key text NOT NULL,
  city text NOT NULL DEFAULT '',
  title text,
  description text,
  keywords text[] NOT NULL DEFAULT '{}',
  image_url text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_key, city)
);
GRANT SELECT ON public.seo_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_overrides TO authenticated;
GRANT ALL ON public.seo_overrides TO service_role;
ALTER TABLE public.seo_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SEO public read" ON public.seo_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "SEO admin insert" ON public.seo_overrides FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "SEO admin update" ON public.seo_overrides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "SEO admin delete" ON public.seo_overrides FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER seo_overrides_updated BEFORE UPDATE ON public.seo_overrides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();