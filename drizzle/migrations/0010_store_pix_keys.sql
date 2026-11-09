CREATE TABLE public.store_pix_keys (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  key_type text NOT NULL CHECK (key_type IN ('cnpj','cpf','phone','email','evp')),
  pix_key text NOT NULL CHECK (char_length(pix_key) BETWEEN 1 AND 77),
  holder_name text NOT NULL CHECK (char_length(holder_name) BETWEEN 2 AND 60),
  holder_city text NOT NULL CHECK (char_length(holder_city) BETWEEN 2 AND 40),
  bank_name text CHECK (bank_name IS NULL OR char_length(bank_name) <= 60),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_pix_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_pix_keys TO authenticated;
GRANT ALL ON public.store_pix_keys TO service_role;
ALTER TABLE public.store_pix_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pix public read for approved stores" ON public.store_pix_keys FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND (s.approved OR s.owner_id = auth.uid())) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pix owner or admin insert" ON public.store_pix_keys FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pix owner or admin update" ON public.store_pix_keys FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pix owner or admin delete" ON public.store_pix_keys FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER store_pix_keys_updated BEFORE UPDATE ON public.store_pix_keys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();