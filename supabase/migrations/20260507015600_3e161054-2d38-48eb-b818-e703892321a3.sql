drop policy if exists "offer-images owner insert" on storage.objects;
drop policy if exists "offer-images owner update" on storage.objects;
drop policy if exists "offer-images owner delete" on storage.objects;

create policy "offer-images owner insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1
      from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
);

create policy "offer-images owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1
      from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
)
with check (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1
      from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
);

create policy "offer-images owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1
      from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
);