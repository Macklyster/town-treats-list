
create table if not exists public.store_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

create index if not exists store_favorites_user_idx on public.store_favorites(user_id, created_at desc);
create index if not exists store_favorites_store_idx on public.store_favorites(store_id);

grant select, insert, delete on public.store_favorites to authenticated;
grant all on public.store_favorites to service_role;

alter table public.store_favorites enable row level security;

drop policy if exists "own store favorites" on public.store_favorites;
create policy "own store favorites"
on public.store_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
