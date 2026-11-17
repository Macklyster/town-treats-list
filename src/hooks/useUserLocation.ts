import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

const STORAGE_KEY = "ofertasfly:userLoc";

type State = {
  loc: LatLng | null;
  loading: boolean;
  error: string | null;
};

export function useUserLocation() {
  const [state, setState] = useState<State>({ loc: null, loading: false, error: null });

  // Saved location is restored after mount so server and first client render match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        setState({ loc: parsed, loading: false, error: null });
      }
    } catch {}
  }, []);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Navegador não suporta geolocalização" }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        } catch {}
        setState({ loc, loading: false, error: null });
      },
      (err) => {
        setState({ loc: null, loading: false, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setState({ loc: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    // re-emit storage updates across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        setState((s) => ({ ...s, loc: parsed ?? null }));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { ...state, request, clear };
}
