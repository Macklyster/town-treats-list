import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type City = { city: string; state: string };

type CityContextValue = {
  city: City | null;
  setCity: (c: City) => void;
  clearCity: () => void;
  openSelector: () => void;
  closeSelector: () => void;
  selectorOpen: boolean;
  availableCities: City[];
  loadingCities: boolean;
};

const STORAGE_KEY = "ofertasfly:city";
const DISMISS_KEY = "ofertasfly:city_dismissed";
const CityContext = createContext<CityContextValue | undefined>(undefined);

const readStored = (): City | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.city === "string" && typeof p.state === "string") return p;
  } catch {}
  return null;
};

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const [city, setCityState] = useState<City | null>(() => readStored());
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Auto-open selector on first visit
  useEffect(() => {
    if (!city) setSelectorOpen(true);
  }, []); // eslint-disable-line

  // Load available cities (distinct from approved stores)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("stores")
        .select("city,state")
        .eq("approved", true);
      const set = new Map<string, City>();
      (data ?? []).forEach((r: any) => {
        const c = (r.city ?? "").trim();
        const s = (r.state ?? "").trim().toUpperCase();
        if (!c || c === "Não informado") return;
        const key = `${c}|${s}`;
        if (!set.has(key)) set.set(key, { city: c, state: s });
      });
      const list = Array.from(set.values()).sort((a, b) =>
        a.city.localeCompare(b.city, "pt-BR")
      );
      setAvailableCities(list);
      setLoadingCities(false);
    })();
  }, []);

  const setCity = useCallback((c: City) => {
    setCityState(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setSelectorOpen(false);
  }, []);

  const clearCity = useCallback(() => {
    setCityState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<CityContextValue>(
    () => ({
      city,
      setCity,
      clearCity,
      openSelector: () => setSelectorOpen(true),
      closeSelector: () => setSelectorOpen(false),
      selectorOpen,
      availableCities,
      loadingCities,
    }),
    [city, selectorOpen, availableCities, loadingCities, setCity, clearCity]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used within CityProvider");
  return ctx;
};
