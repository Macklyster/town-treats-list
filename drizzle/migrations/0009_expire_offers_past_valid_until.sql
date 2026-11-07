CREATE OR REPLACE FUNCTION public.expire_past_due_offers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.offers
  SET status = 'paused'
  WHERE status = 'approved'
    AND valid_until IS NOT NULL
    AND valid_until < (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_past_due_offers() TO service_role;

DROP POLICY "approved offers public read" ON public.offers;

CREATE POLICY "approved offers public read"
ON public.offers
FOR SELECT
USING (
  (
    status = 'approved'::offer_status
    AND (valid_until IS NULL OR valid_until >= (now() AT TIME ZONE 'America/Sao_Paulo')::date)
    AND (
      is_scheduled = false
      OR (scheduled_start_at IS NOT NULL AND scheduled_start_at <= now())
    )
    AND (scheduled_end_at IS NULL OR scheduled_end_at > now())
  )
  OR EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = offers.store_id AND s.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);