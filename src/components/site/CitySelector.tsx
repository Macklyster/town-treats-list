import { useMemo, useState } from "react";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCity, type City } from "@/hooks/useCity";

export const CitySelector = () => {
  const { selectorOpen, closeSelector, setCity, availableCities, loadingCities } = useCity();
  const [q, setQ] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return availableCities;
    return availableCities.filter(
      (c) =>
        c.city.toLowerCase().includes(term) ||
        c.state.toLowerCase().includes(term)
    );
  }, [q, availableCities]);

  const handleSelect = (c: City) => {
    setCity(c);
    toast.success(`Pronto! Mostrando ofertas em ${c.city}${c.state ? " · " + c.state : ""}`);
  };

  const useGeolocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`;
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          const data = await res.json();
          const a = data?.address ?? {};
          const cityName: string =
            a.city || a.town || a.village || a.municipality || a.county || "";
          const stateUF: string = (a["ISO3166-2-lvl4"] ?? "").split("-")[1] ?? "";
          if (!cityName) {
            toast.error("Não foi possível identificar sua cidade.");
            return;
          }
          handleSelect({ city: cityName, state: stateUF });
        } catch {
          toast.error("Falha ao detectar localização.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        toast.error("Permissão de localização negada.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <Dialog open={selectorOpen} onOpenChange={(o) => (o ? null : closeSelector())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent-strong" />
            Selecione sua cidade
          </DialogTitle>
          <DialogDescription>
            Personalizamos as ofertas para você ver apenas o que existe perto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="accent"
            className="w-full"
            onClick={useGeolocation}
            disabled={geoLoading}
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Usar minha localização
          </Button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cidade…"
              className="pl-9"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
            {loadingCities ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Carregando cidades…</p>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {availableCities.length === 0
                  ? "Ainda não temos lojas cadastradas. Volte em breve!"
                  : "Nenhuma cidade encontrada com esse nome."}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((c) => (
                  <li key={`${c.city}|${c.state}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{c.city}</span>
                      {c.state && (
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {c.state}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
