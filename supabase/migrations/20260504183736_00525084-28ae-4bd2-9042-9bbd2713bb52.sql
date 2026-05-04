-- Restrict SECURITY DEFINER functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
-- has_role needs to remain executable by authenticated (used in RLS via auth.uid())
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Ensure set_updated_at has explicit search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;