
-- push_subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own push subs" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read all push subs" ON public.push_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- store_followers
CREATE TABLE public.store_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);
CREATE INDEX idx_store_followers_store ON public.store_followers(store_id);
CREATE INDEX idx_store_followers_user ON public.store_followers(user_id);
ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own follows" ON public.store_followers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "store owners read followers" ON public.store_followers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_followers.store_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR auth.uid() = user_id
  );

-- notification_preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  new_offers_followed_stores boolean NOT NULL DEFAULT true,
  expiring_favorites boolean NOT NULL DEFAULT true,
  city_new_offers boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own notif prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read notif prefs" ON public.notification_preferences
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notif_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- notifications_log
CREATE TABLE public.notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('store_followers','auto_new_offer','auto_expiring','broadcast')),
  store_id uuid,
  offer_id uuid,
  sent_by uuid,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  recipients_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_log_store ON public.notifications_log(store_id);
CREATE INDEX idx_notif_log_offer ON public.notifications_log(offer_id);
CREATE UNIQUE INDEX idx_notif_log_dedup_auto
  ON public.notifications_log(audience, offer_id)
  WHERE audience IN ('auto_new_offer','store_followers') AND offer_id IS NOT NULL;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage notif log" ON public.notifications_log
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "store owners read own notif log" ON public.notifications_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = notifications_log.store_id AND s.owner_id = auth.uid())
  );

-- favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_offer ON public.favorites(offer_id);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- pg_cron + pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
