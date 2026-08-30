import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";

type Permission = NotificationPermission | "unsupported";

async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return await navigator.serviceWorker.ready;
  await navigator.serviceWorker.register("/sw.js");
  return await navigator.serviceWorker.ready;
}

async function persistSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const { error } = await supabase.functions.invoke("subscribe-push", {
    body: {
      endpoint: json.endpoint,
      keys: json.keys,
      user_agent: navigator.userAgent,
    },
  });
  if (error) throw error;
}

export function usePush() {
  const supported = typeof window !== "undefined" &&
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [permission, setPermission] = useState<Permission>(
    supported ? Notification.permission : "unsupported",
  );
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
      // Ressincroniza o endpoint no banco: se o navegador tem inscrição ativa
      // mas o registro no servidor está antigo/ausente, o push nunca chega.
      if (sub) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          try {
            await persistSubscription(sub);
          } catch {
            /* silencioso: apenas sincronização */
          }
        }
      }
    } catch {
      setSubscribed(false);
    }
  }, [supported]);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const subscribe = useCallback(async () => {
    if (!supported) throw new Error("Notificações não suportadas neste navegador.");
    setLoading(true);
    try {
      // Em iOS o PWA precisa estar instalado
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") throw new Error("Permissão negada.");

      const reg = await ensureRegistration();
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      await persistSubscription(sub);
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.functions.invoke("unsubscribe-push", {
          body: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const sendTest = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("push-test");
    if (error) throw error;
    return data as { recipients: number; success: number; removed: number };
  }, []);

  return {
    supported, permission, subscribed, loading,
    subscribe, unsubscribe, refreshStatus, sendTest,
  };
}
