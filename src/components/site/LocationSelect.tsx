import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type IbgeState = { sigla: string; nome: string };

let statesCache: IbgeState[] | null = null;
const citiesCache = new Map<string, string[]>();

async function fetchStates(): Promise<IbgeState[]> {
  if (statesCache) return statesCache;
  const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
  const data = await res.json();
  statesCache = (data as any[]).map((s) => ({ sigla: s.sigla, nome: s.nome }));
  return statesCache;
}

async function fetchCities(uf: string): Promise<string[]> {
  const cached = citiesCache.get(uf);
  if (cached) return cached;
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
  );
  const data = await res.json();
  const names = (data as any[]).map((m) => m.nome as string);
  citiesCache.set(uf, names);
  return names;
}

type StateSelectProps = {
  value: string;
  onChange: (uf: string) => void;
};

export function StateSelect({ value, onChange }: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<IbgeState[]>(statesCache ?? []);
  const [loading, setLoading] = useState(!statesCache);

  useEffect(() => {
    if (statesCache) return;
    fetchStates()
      .then(setStates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = states.find((s) => s.sigla === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? `${selected.sigla} — ${selected.nome}` : value || "Selecione o estado"}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar estado…" />
          <CommandList>
            <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
            <CommandGroup>
              {states.map((s) => (
                <CommandItem
                  key={s.sigla}
                  value={`${s.sigla} ${s.nome}`}
                  onSelect={() => {
                    onChange(s.sigla);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === s.sigla ? "opacity-100" : "opacity-0")} />
                  {s.sigla} — {s.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type CitySelectProps = {
  uf: string;
  value: string;
  onChange: (city: string) => void;
};

export function CitySelect({ uf, value, onChange }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uf) {
      setCities([]);
      return;
    }
    setLoading(true);
    fetchCities(uf)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, [uf]);

  const items = useMemo(() => {
    // Keep a previously saved value selectable even if it is not in the IBGE list
    if (value && !cities.includes(value)) return [value, ...cities];
    return cities;
  }, [cities, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={!uf}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {!uf ? "Selecione o estado primeiro" : value || "Selecione a cidade"}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cidade…" />
          <CommandList>
            <CommandEmpty>
              {loading ? "Carregando cidades…" : "Nenhuma cidade encontrada."}
            </CommandEmpty>
            <CommandGroup>
              {items.map((c) => (
                <CommandItem
                  key={c}
                  value={c}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c ? "opacity-100" : "opacity-0")} />
                  {c}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
