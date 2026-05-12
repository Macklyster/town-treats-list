alter table public.offers
  add column if not exists auto_renew boolean not null default false,
  add column if not exists auto_renew_days int not null default 7,
  add column if not exists auto_renew_count int not null default 0,
  add column if not exists last_auto_renewed_at timestamptz;