
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  subscription_id uuid,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners insert cancellation reasons"
ON public.cancellation_reasons
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.stores s WHERE s.id = cancellation_reasons.store_id AND s.owner_id = auth.uid()
));

CREATE POLICY "owners read cancellation reasons"
ON public.cancellation_reasons
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = cancellation_reasons.store_id AND s.owner_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admins manage cancellation reasons"
ON public.cancellation_reasons
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
