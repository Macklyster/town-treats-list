CREATE POLICY "Admins confirm managed store coupon redemptions"
ON public.coupon_redemptions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND EXISTS (
  SELECT 1 FROM public.coupons c WHERE c.id = coupon_redemptions.coupon_id AND public.is_managed_store(c.store_id)
))
WITH CHECK (public.has_role(auth.uid(), 'admin') AND EXISTS (
  SELECT 1 FROM public.coupons c WHERE c.id = coupon_redemptions.coupon_id AND public.is_managed_store(c.store_id)
));