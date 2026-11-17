create table if not exists public.internal_hook_secrets (
  name text primary key,
  secret text not null,
  created_at timestamptz not null default now()
);
alter table public.internal_hook_secrets enable row level security;
revoke all on public.internal_hook_secrets from anon, authenticated;
grant all on public.internal_hook_secrets to service_role;

insert into public.internal_hook_secrets(name, secret)
values ('offer_email', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create table if not exists public.offer_email_notices (
  offer_id uuid not null,
  kind text not null check (kind in ('pending','published')),
  created_at timestamptz not null default now(),
  primary key (offer_id, kind)
);
alter table public.offer_email_notices enable row level security;
revoke all on public.offer_email_notices from anon, authenticated;
grant all on public.offer_email_notices to service_role;

create or replace function public.trg_offer_email_notice()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_kind text;
  v_secret text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    v_kind := 'pending';
  elsif tg_op = 'INSERT' and new.status = 'approved' then
    v_kind := 'published';
  elsif tg_op = 'UPDATE' and new.status = 'approved' and old.status is distinct from 'approved' then
    v_kind := 'published';
  else
    return new;
  end if;

  insert into public.offer_email_notices(offer_id, kind) values (new.id, v_kind)
  on conflict do nothing;
  if not found then return new; end if;

  select secret into v_secret from public.internal_hook_secrets where name = 'offer_email';
  begin
    perform net.http_post(
      url := 'https://project--934a5999-9206-4081-8a15-19b03ff711c8.lovable.app/api/public/hooks/offer-email',
      headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', v_secret),
      body := jsonb_build_object('offer_id', new.id, 'kind', v_kind)
    );
  exception when others then
    raise warning 'offer email hook failed: %', sqlerrm;
  end;
  return new;
end $$;
revoke execute on function public.trg_offer_email_notice() from public, anon, authenticated;

drop trigger if exists offer_email_notice on public.offers;
create trigger offer_email_notice after insert or update of status on public.offers
for each row execute function public.trg_offer_email_notice();