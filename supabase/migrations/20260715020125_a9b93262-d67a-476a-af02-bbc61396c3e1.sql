
-- Atualiza calc_flyscore_pilares para incluir eventos no pilar "atualização"
CREATE OR REPLACE FUNCTION public.calc_flyscore_pilares(_store_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s public.stores;
  avg_rating numeric;
  review_count integer;
  volume_factor numeric;
  p_avaliacoes numeric;
  info_score numeric;
  filled integer := 0;
  total integer := 0;
  last_offer_activity timestamptz;
  last_event_activity timestamptz;
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

  -- Pilar Informações
  total := 0; filled := 0;
  total := total + 2; if s.name is not null and length(trim(s.name)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.city is not null and length(trim(s.city)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.state is not null and length(trim(s.state)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.address is not null and length(trim(s.address)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.logo_url is not null and length(trim(s.logo_url)) > 0 then filled := filled + 2; end if;
  total := total + 2; if s.whatsapp is not null and length(trim(s.whatsapp)) > 0 then filled := filled + 2; end if;
  total := total + 1; if s.description is not null and length(trim(s.description)) > 20 then filled := filled + 1; end if;
  total := total + 1; if s.cover_url is not null and length(trim(s.cover_url)) > 0 then filled := filled + 1; end if;
  total := total + 1; if s.phone is not null and length(trim(s.phone)) > 0 then filled := filled + 1; end if;
  total := total + 1; if s.instagram is not null and length(trim(s.instagram)) > 0 then filled := filled + 1; end if;
  total := total + 1; if s.latitude is not null and s.longitude is not null then filled := filled + 1; end if;

  info_score := round((filled::numeric / nullif(total, 0)) * 100);

  -- Pilar Atualização: última atividade entre Ofertas e Eventos
  select greatest(max(updated_at), max(created_at))
    into last_offer_activity
  from public.offers
  where store_id = _store_id;

  select greatest(max(updated_at), max(created_at))
    into last_event_activity
  from public.events
  where store_id = _store_id and status = 'approved';

  last_activity := greatest(last_offer_activity, last_event_activity);

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
$function$;

-- Gatilho: recomputa FlyScore quando eventos mudam
CREATE OR REPLACE FUNCTION public.trg_flyscore_from_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

DROP TRIGGER IF EXISTS events_flyscore ON public.events;
CREATE TRIGGER events_flyscore
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.trg_flyscore_from_event();

-- Recalcula todas as lojas
SELECT public.recompute_all_flyscores();
