import { useCallback, useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crosshair, MapPin, Info } from "lucide-react";
import { toast } from "sonner";

type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  addressQuery?: string;
};

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const BR_CENTER: LatLng = { lat: -14.235, lng: -51.925 };

function PlacesSearch({
  onPick,
  defaultValue,
}: {
  onPick: (v: LatLng) => void;
  defaultValue?: string;
}) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current || autocompleteRef.current) return;
    const ac = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "br" },
      fields: ["geometry", "formatted_address", "name"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const loc = place.geometry?.location;
      if (!loc) {
        toast.error("Local sem coordenadas — escolha outro");
        return;
      }
      onPick({ lat: loc.lat(), lng: loc.lng() });
    });
    autocompleteRef.current = ac;
  }, [places, onPick]);

  return (
    <Input
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder="Buscar endereço, loja ou ponto de referência"
      className="w-full"
    />
  );
}

function MapContent({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !value) return;
    map.panTo(value);
    if ((map.getZoom() ?? 4) < 15) map.setZoom(16);
  }, [map, value?.lat, value?.lng]);

  return (
    <Map
      defaultCenter={value ?? BR_CENTER}
      defaultZoom={value ? 16 : 4}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId="ofertasfly-location-picker"
      onClick={(e) => {
        if (e.detail.latLng) onChange(e.detail.latLng);
      }}
      style={{ width: "100%", height: 320 }}
    >
      {value && (
        <AdvancedMarker
          position={value}
          draggable
          onDragEnd={(e) => {
            if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }}
        />
      )}
    </Map>
  );
}

export const LocationPicker = ({ value, onChange, addressQuery }: Props) => {
  const [searching, setSearching] = useState(false);

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Navegador sem suporte a geolocalização");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => toast.error(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onChange]);

  if (!API_KEY) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Mapa indisponível — configure <code>VITE_GOOGLE_MAPS_API_KEY</code> para habilitar a seleção de localização.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" /> Localização exata no mapa
      </Label>
      <p className="text-xs text-muted-foreground">
        Busque pelo nome ou endereço, ou clique/arraste o pino no mapa para marcar o ponto exato da loja.
      </p>

      <APIProvider apiKey={API_KEY} libraries={["places"]}>
        <div className="space-y-2">
          <PlacesSearch onPick={onChange} defaultValue={addressQuery} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
              <Crosshair className="mr-1 h-4 w-4" /> Usar minha localização
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border border-border">
            <MapContent value={value} onChange={onChange} />
          </div>
        </div>
      </APIProvider>

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
