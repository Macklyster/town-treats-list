import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OfferCard } from "@/components/site/OfferCard";
import { fetchOffers, UIOffer, discountPct } from "@/lib/offers-api";
import { useCity } from "@/hooks/useCity";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm } from "@/lib/geo";
import { categories } from "@/data/categories";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OffersMap } from "@/components/site/OffersMap";
import { offerToMapPin } from "@/lib/map-items";
import { MapPin, X, Map as MapIcon } from "lucide-react";
import { fetchOfferSocialProof, SocialProof } from "@/lib/social-proof";

const types = [
  { v: "all", l: "Todos" },
  { v: "desconto", l: "Desconto" },
  { v: "cupom", l: "Cupom" },
  { v: "brinde", l: "Brinde" },
];

const baseSortOptions = [
  { v: "recent", l: "Mais recentes" },
  { v: "popular", l: "Mais populares" },
  { v: "lowest", l: "Menor preço" },
  { v: "discount", l: "Maior desconto" },
];

interface OffersSectionProps {
  offers?: UIOffer[];
  loading?: boolean;
}

export const OffersSection = ({ offers: providedOffers, loading: providedLoading }: OffersSectionProps) => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("categoria") ?? "all";
  const type = params.get("tipo") ?? "all";
  const sort = params.get("ordem") ?? "recent";

  const { city, openSelector } = useCity();
  const { loc: userLoc, request: requestLoc, clear: clearLoc, loading: locLoading, error: locError } = useUserLocation();
  const [internalOffers, setInternalOffers] = useState<UIOffer[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  const useInternal = providedOffers === undefined;

  useEffect(() => {
    if (!useInternal) return;
    if (!city) {
      setInternalOffers([]);
      setInternalLoading(false);
      return;
    }
    setInternalLoading(true);
    fetchOffers(city).then((o) => {
      setInternalOffers(o);
      setInternalLoading(false);
    });
  }, [city?.city, city?.state, useInternal]);

  const all = useInternal ? internalOffers : (providedOffers ?? []);
  const loading = useInternal ? internalLoading : (providedLoading ?? false);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === "all") next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  // attach distance when we have user location
  const allWithDistance = useMemo(() => {
    if (!userLoc) return all;
    return all.map((o) => {
      if (typeof o.storeLat !== "number" || typeof o.storeLng !== "number") return o;
      return {
        ...o,
        distanceKm: haversineKm(userLoc, { lat: o.storeLat, lng: o.storeLng }),
      };
    });
  }, [all, userLoc?.lat, userLoc?.lng]);

  const sortOptions = useMemo(
    () => (userLoc ? [{ v: "nearby", l: "Perto de mim" }, ...baseSortOptions] : baseSortOptions),
    [userLoc],
  );

  const list = useMemo(() => {
    let l = allWithDistance.filter((o) => {
      if (q && !`${o.title} ${o.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "all" && o.category !== cat) return false;
      if (type !== "all" && o.type !== type) return false;
      return true;
    });
    if (sort === "popular") l = [...l].sort((a, b) => b.popularity - a.popularity);
    else if (sort === "lowest") l = [...l].sort((a, b) => a.promoPrice - b.promoPrice);
    else if (sort === "discount") l = [...l].sort((a, b) => discountPct(b) - discountPct(a));
    else if (sort === "nearby" && userLoc) {
      l = [...l].sort((a, b) => {
        const da = a.distanceKm ?? Infinity;
        const db = b.distanceKm ?? Infinity;
        return da - db;
      });
    } else l = [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return l;
  }, [allWithDistance, q, cat, type, sort, userLoc]);

  const hasMappable = useMemo(
    () => allWithDistance.some((o) => typeof o.storeLat === "number" && typeof o.storeLng === "number"),
    [allWithDistance],
  );

  const handleNearby = () => {
    if (userLoc) {
      setParam("ordem", "nearby");
    } else {
      requestLoc();
      setParam("ordem", "nearby");
    }
  };

  const clearFilters = () => {
    const next = new URLSearchParams(params);
    next.delete("q");
    next.delete("categoria");
    next.delete("tipo");
    next.delete("ordem");
    setParams(next, { replace: true });
  };

  return (
    <section id="ofertas" data-scroll-anchor className="container py-20">
      <header className="mb-10">
        <h2 className="text-display text-foreground md:text-[40px]">Ofertas</h2>
        <p className="mt-2 text-muted-foreground">
          {!city
            ? "Selecione uma cidade para ver ofertas."
            : loading
            ? "Carregando…"
            : `${list.length} oferta${list.length !== 1 ? "s" : ""} encontrada${list.length !== 1 ? "s" : ""} em ${city.city}.`}
        </p>
        {!city && (
          <button
            type="button"
            onClick={openSelector}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-pop hover:opacity-90"
          >
            Escolher cidade
          </button>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-40 lg:self-start">
          <div className="space-y-2">
            <Button
              type="button"
              variant={userLoc ? "secondary" : "accent"}
              className="w-full"
              onClick={handleNearby}
              disabled={locLoading}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {locLoading ? "Localizando…" : userLoc ? "Localização ativa" : "Perto de mim"}
            </Button>
            {userLoc && (
              <button
                type="button"
                onClick={() => {
                  clearLoc();
                  if (sort === "nearby") setParam("ordem", "recent");
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> remover minha localização
              </button>
            )}
            {locError && (
              <p className="text-xs text-destructive">Não foi possível obter sua localização.</p>
            )}
          </div>
          <div>
            <Label htmlFor="q">Buscar</Label>
            <Input
              id="q"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder="Palavra-chave"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={cat} onValueChange={(v) => setParam("categoria", v)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setParam("tipo", v)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            {hasMappable ? (
            <Button
              type="button"
              variant="accent"
              size="sm"
              className="shadow-pop"
              onClick={() => setShowMap((v) => !v)}
            >
              <MapIcon className="mr-2 h-4 w-4" />
              {showMap ? "Ocultar mapa" : "Ver no mapa"}
            </Button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por</span>
              <Select value={sort} onValueChange={(v) => setParam("ordem", v)}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map((s) => (
                    <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showMap && hasMappable && (
            <div className="mb-6">
              <OffersMap offers={list} userLoc={userLoc} />
            </div>
          )}

          {!loading && list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-lg font-medium text-foreground">Nenhuma oferta encontrada</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente ajustar os filtros ou limpar a busca.
              </p>
            </div>
          ) : (
            <OffersGrid offers={list} />
          )}
        </div>
      </div>
    </section>
  );
};

const OffersGrid = ({ offers }: { offers: UIOffer[] }) => {
  const [sp, setSp] = useState<Map<string, SocialProof>>(new Map());
  const ids = useMemo(() => offers.map((o) => o.id), [offers]);
  const idsKey = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (!ids.length) {
        setSp(new Map());
        return;
      }
      fetchOfferSocialProof(ids.slice(0, 60)).then((m) => {
        if (!cancelled) setSp(m);
      });
    };
    load();
    const t = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [idsKey]);

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} socialProof={sp.get(o.id)} />
      ))}
    </div>
  );
};
