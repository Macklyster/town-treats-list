
-- ============================================================
-- FlyScore MVP — cálculo automático dos 3 pilares
-- ============================================================

create or replace function public.calc_flyscore_pilares(_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s public.stores;
  avg_rating numeric;
  review_count integer;
  volume_factor numeric;
  p_avaliacoes numeric;
  info_score numeric;
  filled integer := 0;
  total integer := 0;
  last_activity timestamptz;
  days_since numeric;
  p_atualizacao numeric;
  overall numeric;
begin
  select * into s from public.stores where id = _store_id;
  if not found then
    return jsonb_build_object(
      'avaliacoes', 0, 'informacoes', 0, 'atualizacao', 0, 'overall', 0
    );
  end if;

  -- Pilar Avaliações
  select coalesce(avg(rating), 0), count(*)
    into avg_rating, review_count
  from public.offer_reviews
  where store_id = _store_id and status = 'approved';

  volume_factor := least(1.0, review_count::numeric / 20.0);
  if review_count = 0 then
    p_avaliacoes := 0;
  else
    p_avaliacoes := round(least(100, avg_rating * 20 * greatest(0.4, volume_factor)));
  end if;

  -- Pilar Informações (peso 2 nos obrigatórios, peso 1 nos opcionais)
  total := 0; filled := 0;
  -- Obrigatórios (peso 2)
  total := total + 2; if s.name is not null and length(trim(s.name)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.city is not null and length(trim(s.city)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.state is not null and length(trim(s.state)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.address is not null and length(trim(s.address)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.logo_url is not null and length(trim(s.logo_url)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.whatsapp is not null and length(trim(s.whatsapp)) > 0 then filled := filled + 2; end if;
  -- Opcionais (peso 1)
  total := total + 1; if s.description is not null and length(trim(s.description)) > 20 then filled := filled + 1; end if;
  total := total + 1; if s.cover_url is not null and length(trim(s.cover_url)) > 0 then filled := filled + 1; end if;
  total := total + 1; if s.phone is not null and length(trim(s.phone)) > 0 then filled := filled + 1; end if;
  total := total + 1; if s.instagram is not null and length(trim(s.instagram)) > 0 then filled := filled + 1; end if;
  total := total + 1; if s.latitude is not null and s.longitude is not null then filled := filled + 1; end if;

  info_score := round((filled::numeric / nullif(total, 0)) * 100);

  -- Pilar Atualização: última oferta criada/editada
  select greatest(max(updated_at), max(created_at))
    into last_activity
  from public.offers
  where store_id = _store_id;

  if last_activity is null then
    p_atualizacao := 0;
  else
    days_since := extract(epoch from (now() - last_activity)) / 86400.0;
    if days_since <= 30 then
      p_atualizacao := 100;
    elsif days_since >= 120 then
      p_atualizacao := 0;
    else
      p_atualizacao := round(100 - ((days_since - 30) / 90.0) * 100);
    end if;
  end if;

  overall := round((p_avaliacoes + info_score + p_atualizacao) / 3.0);

  return jsonb_build_object(
    'avaliacoes', p_avaliacoes,
    'informacoes', info_score,
    'atualizacao', p_atualizacao,
    'overall', overall,
    'review_count', review_count,
    'avg_rating', round(avg_rating::numeric, 2)
  );
end;
$$;

grant execute on function public.calc_flyscore_pilares(uuid) to authenticated, anon, service_role;

-- Recomputa e persiste em company_flyscore
create or replace function public.recompute_flyscore(_store_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  data jsonb;
begin
  if _store_id is null then return; end if;
  data := public.calc_flyscore_pilares(_store_id);
  insert into public.company_flyscore (store_id, overall, pilares, updated_at)
  values (_store_id, (data->>'overall')::numeric, data, now())
  on conflict (store_id) do update
    set overall = excluded.overall,
        pilares = excluded.pilares,
        updated_at = now();
end;
$$;

grant execute on function public.recompute_flyscore(uuid) to authenticated, service_role;

-- Batch: recompute all approved stores (útil no primeiro deploy)
create or replace function public.recompute_all_flyscores()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in select id from public.stores where approved = true loop
    perform public.recompute_flyscore(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function public.recompute_all_flyscores() to service_role;

-- ============================================================
-- Triggers
-- ============================================================

create or replace function public.trg_flyscore_from_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_flyscore(old.store_id);
    return old;
  else
    perform public.recompute_flyscore(new.store_id);
    if tg_op = 'UPDATE' and old.store_id is distinct from new.store_id then
      perform public.recompute_flyscore(old.store_id);
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists offer_reviews_flyscore on public.offer_reviews;
create trigger offer_reviews_flyscore
after insert or update or delete on public.offer_reviews
for each row execute function public.trg_flyscore_from_review();

create or replace function public.trg_flyscore_from_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_flyscore(old.store_id);
    return old;
  else
    perform public.recompute_flyscore(new.store_id);
    return new;
  end if;
end;
$$;

drop trigger if exists offers_flyscore on public.offers;
create trigger offers_flyscore
after insert or update or delete on public.offers
for each row execute function public.trg_flyscore_from_offer();

create or replace function public.trg_flyscore_from_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_flyscore(new.id);
  return new;
end;
$$;

drop trigger if exists stores_flyscore on public.stores;
create trigger stores_flyscore
after insert or update on public.stores
for each row execute function public.trg_flyscore_from_store();

-- Permitir dono da loja recalcular manualmente (botão "Atualizar agora")
drop policy if exists "flyscore owner write" on public.company_flyscore;
create policy "flyscore owner write" on public.company_flyscore
for all to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or exists (select 1 from public.stores s where s.id = company_flyscore.store_id and s.owner_id = auth.uid())
)
with check (
  public.has_role(auth.uid(),'admin')
  or exists (select 1 from public.stores s where s.id = company_flyscore.store_id and s.owner_id = auth.uid())
);

-- Popular pela primeira vez
select public.recompute_all_flyscores();
