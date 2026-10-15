CREATE POLICY "admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL DEFAULT auth.uid(),
  store_id uuid,
  section text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert audit" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());
CREATE INDEX admin_audit_log_store_idx ON public.admin_audit_log(store_id, created_at DESC);