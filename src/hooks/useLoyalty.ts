import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLoyaltyState,
  fetchLoyaltyWallet,
  type LoyaltyState,
  type LoyaltyWallet,
} from "@/lib/loyalty-api";

/** Carteira FlyPontos do consumidor logado. */
export function useLoyaltyWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<LoyaltyWallet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setWallet(await fetchLoyaltyWallet());
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { wallet, loading, refresh: load };
}

/** Estado do programa de fidelidade de uma loja. */
export function useLoyaltyState(storeId: string | null | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<LoyaltyState | null>(null);
  const [loading, setLoading] = useState(!!storeId);

  const load = useCallback(async () => {
    if (!storeId) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setState(await fetchLoyaltyState(storeId));
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [storeId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, loading, refresh: load };
}
