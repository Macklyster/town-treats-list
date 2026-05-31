
-- 1. app_settings: novas colunas globais
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS scheduled_offer_min_lead_hours int NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS scheduled_offer_max_lead_days int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS offer_approval_sla_hours int NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS offer_min_validity_hours int NOT NULL DEFAULT 6;

-- 2. offers: campos de agendamento
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS is_scheduled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_offers_scheduled_start ON public.offers(scheduled_start_at) WHERE is_scheduled = true;

-- 3. Trigger de validação de agendamento e janelas de validade
CREATE OR REPLACE FUNCTION public.validate_offer_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_min_lead int;
  v_max_lead int;
  v_min_valid int;
  v_is_premium boolean;
BEGIN
  SELECT
    COALESCE(scheduled_offer_min_lead_hours, 12),
    COALESCE(scheduled_offer_max_lead_days, 30),
    COALESCE(offer_min_validity_hours, 6)
  INTO v_min_lead, v_max_lead, v_min_valid
  FROM public.app_settings WHERE id = true;

  IF NEW.is_scheduled THEN
    IF NEW.scheduled_start_at IS NULL THEN
      RAISE EXCEPTION 'scheduled_start_at é obrigatório para ofertas agendadas';
    END IF;

    -- Restrição de plano: somente Destaque ou Plus (admin pode sobrescrever)
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions sub
      JOIN public.plans p ON p.id = sub.plan_id
      WHERE sub.store_id = NEW.store_id
        AND sub.status IN ('active','trialing')
        AND p.slug IN ('destaque','plus')
    ) INTO v_is_premium;

    IF NOT v_is_premium AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Agendamento de ofertas é exclusivo dos planos Destaque e Plus';
    END IF;

    -- Janela de antecedência (apenas em INSERT ou quando a data muda)
    IF TG_OP = 'INSERT' OR NEW.scheduled_start_at IS DISTINCT FROM OLD.scheduled_start_at THEN
      IF NEW.scheduled_start_at < now() + make_interval(hours => v_min_lead) THEN
        RAISE EXCEPTION 'Agende com pelo menos % horas de antecedência', v_min_lead;
      END IF;
      IF NEW.scheduled_start_at > now() + make_interval(days => v_max_lead) THEN
        RAISE EXCEPTION 'Agendamento máximo de % dias no futuro', v_max_lead;
      END IF;
    END IF;

    IF NEW.scheduled_end_at IS NOT NULL THEN
      IF NEW.scheduled_end_at <= NEW.scheduled_start_at THEN
        RAISE EXCEPTION 'scheduled_end_at deve ser maior que scheduled_start_at';
      END IF;
      IF NEW.valid_until IS NOT NULL AND NEW.scheduled_end_at::date > NEW.valid_until THEN
        RAISE EXCEPTION 'scheduled_end_at não pode ultrapassar valid_until';
      END IF;
    END IF;
  ELSE
    -- Limpa campos quando não agendada
    NEW.scheduled_start_at := NULL;
    NEW.scheduled_end_at := NULL;
    -- Validade mínima de ofertas não agendadas
    IF NEW.valid_until IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.valid_until IS DISTINCT FROM OLD.valid_until) THEN
      IF (NEW.valid_until + time '23:59:59') < (now() + make_interval(hours => v_min_valid)) THEN
        RAISE EXCEPTION 'A validade deve ser de pelo menos % horas no futuro', v_min_valid;
      END IF;
    END IF;
  END IF;

  -- Carimba publicação quando entra no ar
  IF NEW.is_scheduled AND NEW.status = 'approved'
     AND NEW.scheduled_start_at <= now()
     AND NEW.scheduled_published_at IS NULL THEN
    NEW.scheduled_published_at := now();
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_offer_schedule ON public.offers;
CREATE TRIGGER trg_validate_offer_schedule
BEFORE INSERT OR UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.validate_offer_schedule();

-- 4. Atualizar RLS pública para esconder ofertas agendadas até o horário
DROP POLICY IF EXISTS "approved offers public read" ON public.offers;
CREATE POLICY "approved offers public read"
ON public.offers
FOR SELECT
USING (
  (status = 'approved'::offer_status
    AND (is_scheduled = false OR (scheduled_start_at IS NOT NULL AND scheduled_start_at <= now()))
    AND (scheduled_end_at IS NULL OR scheduled_end_at > now())
  )
  OR EXISTS (SELECT 1 FROM stores s WHERE s.id = offers.store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
