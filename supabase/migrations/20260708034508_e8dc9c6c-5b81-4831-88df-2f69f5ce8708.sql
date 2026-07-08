
revoke execute on function public.calc_flyscore_pilares(uuid) from anon, public;
revoke execute on function public.recompute_flyscore(uuid) from public;
revoke execute on function public.recompute_all_flyscores() from public, authenticated, anon;
