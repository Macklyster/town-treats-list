import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dias grátis de teste padrão definidos pelo admin em Configurações.
 * Fallback: 14 dias.
 */
export const useTrialSettings = () => {
  const [trialDays, setTrialDays] = useState<number>(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .rpc("trial_default_days" as any)
      .then(({ data }) => {
        if (!mounted) return;
        const n = Number(data);
        if (Number.isFinite(n) && n > 0) setTrialDays(n);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { trialDays, loading };
};
