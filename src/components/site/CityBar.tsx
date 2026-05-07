import { MapPin } from "lucide-react";
import { useCity } from "@/hooks/useCity";

export const CityBar = () => {
  const { city, openSelector } = useCity();

  if (!city) {
    return (
      <div className="bg-accent text-accent-foreground">
        <div className="container flex flex-wrap items-center justify-center gap-3 py-2.5 text-center text-sm font-medium md:justify-between md:text-left">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Selecione sua cidade para ver as melhores ofertas perto de você.
          </span>
          <button
            type="button"
            onClick={openSelector}
            className="rounded-full bg-accent-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent transition-opacity hover:opacity-90"
          >
            Escolher cidade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-secondary/60">
      <div className="container flex items-center justify-center gap-3 py-2 text-center text-xs text-foreground md:text-sm">
        <MapPin className="h-4 w-4 text-accent-strong" />
        <span>
          Mostrando ofertas em{" "}
          <strong>
            {city.city}
            {city.state ? ` · ${city.state}` : ""}
          </strong>
        </span>
        <button
          type="button"
          onClick={openSelector}
          className="font-semibold text-accent-strong hover:underline"
        >
          Trocar
        </button>
      </div>
    </div>
  );
};
