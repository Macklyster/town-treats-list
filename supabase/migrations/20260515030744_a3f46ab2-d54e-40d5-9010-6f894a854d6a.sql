
-- Enum status
create type public.geo_offer_status as enum ('pending','approved','expired','rejected');

-- App settings
alter table public.app_settings add column if not exists geo_offer_max_active_per_store int not null default 1;

-- Notification pref
alter table public.notification_preferences add column if not exists proximity_alerts boolean not null default true;

-- Tabela geo_offers
create table public.geo_offers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  title text not null,
  description text,
  image_url text,
  category_slug text not null,
  conditions text,
  original_price numeric not null default 0,
  promo_price numeric not null default 0,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_meters int not null default 300,
  time_start time not null default '00:00',
  time_end time not null default '23:59',
  valid_from date not null default current_date,
  valid_until date,
  status public.geo_offer_status not null default 'pending',
  share_token text not null default lower(substr(replace((gen_random_uuid())::text, '-', ''), 1, 10)) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_geo_offers_store on public.geo_offers(store_id);
create index idx_geo_offers_status on public.geo_offers(status);

alter table public.geo_offers enable row level security;

create policy "approved geo_offers public read" on public.geo_offers for select
using (status = 'approved' or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or has_role(auth.uid(),'admin'));

create policy "owners insert geo_offers" on public.geo_offers for insert
with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

create policy "owners update geo_offers" on public.geo_offers for update
using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or has_role(auth.uid(),'admin'));

create policy "owners delete geo_offers" on public.geo_offers for delete
using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or has_role(auth.uid(),'admin'));

create trigger trg_geo_offers_updated_at before update on public.geo_offers
for each row execute function public.set_updated_at();

-- Tabela geo_offer_visits
create table public.geo_offer_visits (
  id uuid primary key default gen_random_uuid(),
  geo_offer_id uuid not null references public.geo_offers(id) on delete cascade,
  user_id uuid,
  session_id text,
  visit_date date not null default (now() at time zone 'America/Sao_Paulo')::date,
  entered_at timestamptz not null default now(),
  notified_at timestamptz
);

create unique index uq_geo_offer_visits_user on public.geo_offer_visits(geo_offer_id, user_id, visit_date) where user_id is not null;
create unique index uq_geo_offer_visits_session on public.geo_offer_visits(geo_offer_id, session_id, visit_date) where session_id is not null and user_id is null;
create index idx_geo_offer_visits_offer on public.geo_offer_visits(geo_offer_id);

alter table public.geo_offer_visits enable row level security;

create policy "visits insert anyone" on public.geo_offer_visits for insert with check (true);

create policy "visits read owners admin self" on public.geo_offer_visits for select
using (
  (auth.uid() = user_id)
  or exists (select 1 from public.geo_offers g join public.stores s on s.id=g.store_id where g.id=geo_offer_id and s.owner_id=auth.uid())
  or has_role(auth.uid(),'admin')
);

-- Validação: plano Plus + limite + intervalos
create or replace function public.validate_geo_offer()
returns trigger language plpgsql set search_path = public as $$
declare v_count int; v_max int; v_is_plus boolean;
begin
  if NEW.radius_meters < 50 or NEW.radius_meters > 5000 then
    raise exception 'radius_meters must be between 50 and 5000';
  end if;
  if NEW.promo_price >= NEW.original_price then
    raise exception 'promo_price must be less than original_price';
  end if;
  if NEW.time_end <= NEW.time_start then
    raise exception 'time_end must be greater than time_start';
  end if;

  if (TG_OP = 'INSERT') or (NEW.status in ('pending','approved') and TG_OP='UPDATE' and OLD.status not in ('pending','approved')) then
    select exists (
      select 1 from public.subscriptions sub
      join public.plans p on p.id = sub.plan_id
      where sub.store_id = NEW.store_id and sub.status = 'active' and p.slug = 'plus'
    ) into v_is_plus;
    if not v_is_plus and not public.has_role(auth.uid(),'admin') then
      raise exception 'geo offers are exclusive to the Plus plan';
    end if;

    select coalesce(geo_offer_max_active_per_store, 1) into v_max from public.app_settings where id = true;
    select count(*) into v_count from public.geo_offers
      where store_id = NEW.store_id and status in ('pending','approved')
        and (NEW.id is null or id <> NEW.id);
    if v_count >= v_max then
      raise exception 'store reached the maximum active geo offers limit (%)', v_max;
    end if;
  end if;

  return NEW;
end $$;

create trigger trg_validate_geo_offer before insert or update on public.geo_offers
for each row execute function public.validate_geo_offer();

-- Haversine helper (in meters)
create or replace function public.haversine_meters(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians((lat2-lat1)/2)),2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians((lng2-lng1)/2)),2)
  ));
$$;

-- RPC: geo_offer_state
create or replace function public.geo_offer_state(p_token text, p_lat double precision default null, p_lng double precision default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v public.geo_offers;
  v_distance double precision;
  v_in_radius boolean := false;
  v_in_window boolean;
  v_in_validity boolean;
  v_now_local time;
  v_today date;
  v_store_name text; v_store_whatsapp text;
begin
  select * into v from public.geo_offers where share_token = p_token;
  if v.id is null then return jsonb_build_object('found', false); end if;

  v_today := (now() at time zone 'America/Sao_Paulo')::date;
  v_now_local := (now() at time zone 'America/Sao_Paulo')::time;
  v_in_window := v_now_local >= v.time_start and v_now_local <= v.time_end;
  v_in_validity := v_today >= v.valid_from and (v.valid_until is null or v_today <= v.valid_until);

  if p_lat is not null and p_lng is not null then
    v_distance := public.haversine_meters(p_lat, p_lng, v.center_lat, v.center_lng);
    v_in_radius := v_distance <= v.radius_meters;
  end if;

  select name, whatsapp into v_store_name, v_store_whatsapp from public.stores where id = v.store_id;

  return jsonb_build_object(
    'found', true,
    'in_radius', v_in_radius,
    'in_window', v_in_window,
    'in_validity', v_in_validity,
    'distance_meters', v_distance,
    'status', v.status,
    'store_name', v_store_name,
    'store_whatsapp', v_store_whatsapp,
    'offer', case when v.status = 'approved' and v_in_radius and v_in_window and v_in_validity then
      jsonb_build_object(
        'id', v.id, 'store_id', v.store_id, 'title', v.title, 'description', v.description,
        'image_url', v.image_url, 'category_slug', v.category_slug, 'conditions', v.conditions,
        'original_price', v.original_price, 'promo_price', v.promo_price, 'share_token', v.share_token
      )
    else
      jsonb_build_object(
        'id', v.id, 'title', v.title, 'image_url', v.image_url,
        'radius_meters', v.radius_meters, 'time_start', v.time_start, 'time_end', v.time_end,
        'share_token', v.share_token
      )
    end
  );
end $$;

-- RPC: register visit
create or replace function public.geo_offer_register_visit(p_token text, p_lat double precision, p_lng double precision, p_session_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v public.geo_offers;
  v_uid uuid := auth.uid();
  v_distance double precision;
  v_today date;
  v_now_local time;
begin
  select * into v from public.geo_offers where share_token = p_token;
  if v.id is null or v.status <> 'approved' then return jsonb_build_object('ok', false); end if;
  v_distance := public.haversine_meters(p_lat, p_lng, v.center_lat, v.center_lng);
  if v_distance > v.radius_meters then return jsonb_build_object('ok', false, 'reason','out_of_range'); end if;

  v_today := (now() at time zone 'America/Sao_Paulo')::date;
  v_now_local := (now() at time zone 'America/Sao_Paulo')::time;
  if v_now_local < v.time_start or v_now_local > v.time_end then
    return jsonb_build_object('ok', false, 'reason','out_of_window');
  end if;
  if v_today < v.valid_from or (v.valid_until is not null and v_today > v.valid_until) then
    return jsonb_build_object('ok', false, 'reason','out_of_validity');
  end if;

  insert into public.geo_offer_visits(geo_offer_id, user_id, session_id, visit_date)
    values (v.id, v_uid, p_session_id, v_today)
  on conflict do nothing;

  return jsonb_build_object('ok', true, 'distance_meters', v_distance);
end $$;

-- RPC: list active geo offers for a store (used by painel)
create or replace function public.active_geo_offer_for_store(p_store_id uuid)
returns setof public.geo_offers language sql stable security definer set search_path = public as $$
  select * from public.geo_offers
  where store_id = p_store_id and status in ('pending','approved')
  order by created_at desc limit 1;
$$;
