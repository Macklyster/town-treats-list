import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crosshair, Search, MapPin } from "lucide-react";
import { toast } from "sonner";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  addressQuery?: string; // composed address for "buscar endereço digitado"
};

export const LocationPicker = ({ value, onChange, addressQuery }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searching, setSearching] = useState(false);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initial: [number, number] = value
      ? [value.lat, value.lng]
      : [-14.235, -51.925];
    const map = L.map(containerRef.current, {
      center: initial,
      zoom: value ? 16 : 4,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      setMarker(e.latlng.lat, e.latlng.lng);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    if (value) setMarker(value.lat, value.lng);
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync external value changes
  useEffect(() => {
    if (!mapRef.current || !value) return;
    setMarker(value.lat, value.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  const setMarker = (lat: number, lng: number, recenter = false) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const m = L.marker([lat, lng], { icon: DefaultIcon, draggable: true })
        .addTo(map);
      m.on("dragend", () => {
        const p = m.getLatLng();
        onChange({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = m;
    }
    if (recenter) map.setView([lat, lng], Math.max(map.getZoom(), 16));
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Navegador sem suporte a geolocalização");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarker(lat, lng, true);
        onChange({ lat, lng });
      },
      (err) => toast.error(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const searchAddress = async () => {
    const q = (addressQuery ?? "").trim();
    if (!q) {
      toast.error("Preencha endereço, cidade e UF antes de buscar");
      return;
    }
    setSearching(true);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "br");
      const resp = await fetch(url.toString(), {
        headers: { "Accept-Language": "pt-BR" },
      });
      const results = (await resp.json()) as Array<{ lat: string; lon: string }>;
      if (!results.length) {
        toast.error("Endereço não encontrado — marque manualmente no mapa");
        return;
      }
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      setMarker(lat, lng, true);
      onChange({ lat, lng });
      toast.success("Mapa centralizado — ajuste o pino se necessário");
    } catch (e) {
      toast.error("Erro ao buscar endereço");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" /> Localização exata no mapa
      </Label>
      <p className="text-xs text-muted-foreground">
        Toque/clique no mapa para marcar o ponto exato da loja. Você também pode arrastar o pino.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={searchAddress} disabled={searching}>
          <Search className="mr-1 h-4 w-4" />
          {searching ? "Buscando…" : "Buscar endereço digitado"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
          <Crosshair className="mr-1 h-4 w-4" /> Usar minha localização
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <div ref={containerRef} style={{ height: 320, width: "100%" }} />
      </div>
      {value ? (
        <p className="text-xs text-muted-foreground">
          Coordenadas selecionadas: <span className="font-mono">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum ponto selecionado ainda.</p>
      )}
    </div>
  );
};

export default LocationPicker;
