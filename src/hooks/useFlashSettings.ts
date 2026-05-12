import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFlashSettings = () => {
  const [defaultHours, setDefaultHours] = useState<number>(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("app_settings")
      .select("flash_default_hours")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data?.flash_default_hours) setDefaultHours(data.flash_default_hours);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { defaultHours, loading };
};
