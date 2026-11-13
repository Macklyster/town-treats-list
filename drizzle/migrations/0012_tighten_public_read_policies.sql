DROP POLICY IF EXISTS "duty public read" ON public.store_duty_schedules;
CREATE POLICY "duty public read" ON public.store_duty_schedules FOR SELECT
USING (active AND ends_at > now() - interval '1 day' AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.approved));

DROP POLICY IF EXISTS "Public reads user badges" ON public.loyalty_user_badges;
CREATE POLICY "Public reads user badges" ON public.loyalty_user_badges FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "flyscore public read" ON public.company_flyscore;
CREATE POLICY "flyscore public read" ON public.company_flyscore FOR SELECT
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND (s.approved OR s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "app_settings public read" ON public.app_settings;
CREATE POLICY "app_settings public read" ON public.app_settings FOR SELECT
USING (id = true);