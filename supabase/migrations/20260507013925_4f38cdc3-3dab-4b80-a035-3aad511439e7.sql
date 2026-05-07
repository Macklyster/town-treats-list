insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-logos', 'store-logos', true, 2097152, array['image/svg+xml','image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "store logos public read" on storage.objects;
create policy "store logos public read"
  on storage.objects for select
  using (bucket_id = 'store-logos');

drop policy if exists "owners insert store logo" on storage.objects;
create policy "owners insert store logo"
  on storage.objects for insert
  with check (
    bucket_id = 'store-logos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[1]
          and s.owner_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
    )
  );

drop policy if exists "owners update store logo" on storage.objects;
create policy "owners update store logo"
  on storage.objects for update
  using (
    bucket_id = 'store-logos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[1]
          and s.owner_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
    )
  );

drop policy if exists "owners delete store logo" on storage.objects;
create policy "owners delete store logo"
  on storage.objects for delete
  using (
    bucket_id = 'store-logos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[1]
          and s.owner_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
    )
  );