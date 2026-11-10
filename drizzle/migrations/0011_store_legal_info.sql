CREATE TABLE public.store_legal_info (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  person_type text NOT NULL CHECK (person_type IN ('pf','pj')),
  document text NOT NULL CHECK (document ~ '^[0-9]{11}$|^[0-9]{14}$'),
  legal_name text NOT NULL CHECK (length(trim(legal_name)) BETWEEN 3 AND 160),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doc_matches_type CHECK ((person_type='pf' AND length(document)=11) OR (person_type='pj' AND length(document)=14))
);
ALTER TABLE public.store_legal_info ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.store_legal_info TO authenticated;
CREATE POLICY "owner or admin read legal" ON public.store_legal_info FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id=store_id AND s.owner_id=auth.uid()));
CREATE POLICY "owner or admin insert legal" ON public.store_legal_info FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id=store_id AND s.owner_id=auth.uid()));
CREATE POLICY "owner or admin update legal" ON public.store_legal_info FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id=store_id AND s.owner_id=auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id=store_id AND s.owner_id=auth.uid()));
CREATE TRIGGER store_legal_info_updated BEFORE UPDATE ON public.store_legal_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();