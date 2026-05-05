
insert into storage.buckets (id, name, public)
values ('offer-images', 'offer-images', true)
on conflict (id) do nothing;

-- Public read
create policy "offer-images public read"
on storage.objects for select
using (bucket_id = 'offer-images');

-- Owner insert (path: {store_id}/{file})
create policy "offer-images owner insert"
on storage.objects for insert
with check (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1 from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
);

create policy "offer-images owner update"
on storage.objects for update
using (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1 from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
);

create policy "offer-images owner delete"
on storage.objects for delete
using (
  bucket_id = 'offer-images'
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1 from public.stores s
      where s.id::text = (storage.foldername(name))[1]
        and s.owner_id = auth.uid()
    )
  )
);
