import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** UI hint only; the server enforces access on every AI request. */
export function useAiAssist(storeId: string | null | undefined) {
  const { isAdmin } = useAuth();
  const [hasStoreAccess, setHas] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    if (isAdmin || !storeId) { setLoading(false); return; }
    setLoading(true);
    void supabase.rpc("store_has_ai_assist", { p_store_id: storeId }).then(({ data }) => {
      if (!alive) return;
      setHas(!!data);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [storeId, isAdmin]);
  return { allowed: isAdmin || hasStoreAccess, isAdmin, loading };
}
