import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Copy, Plus, X } from "lucide-react";

export type OpeningRange = { open: string; close: string };
export type OpeningDay = { closed: boolean; ranges: OpeningRange[] };
export type OpeningHours = Record<DayKey, OpeningDay>;

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = typeof DAY_KEYS[number];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo e Feriado",
};

export function defaultOpeningHours(): OpeningHours {
  const base = {} as OpeningHours;
  for (const k of DAY_KEYS) {
    base[k] = { closed: k === "sun", ranges: [{ open: "09:00", close: "18:00" }] };
  }
  return base;
}

export function normalizeOpeningHours(raw: any): OpeningHours {
  if (!raw || typeof raw !== "object") return defaultOpeningHours();
  const out = defaultOpeningHours();
  for (const k of DAY_KEYS) {
    const v = raw[k];
    if (v && typeof v === "object") {
      out[k] = {
        closed: !!v.closed,
        ranges: Array.isArray(v.ranges) && v.ranges.length
          ? v.ranges.map((r: any) => ({ open: String(r?.open ?? "09:00"), close: String(r?.close ?? "18:00") }))
          : [{ open: "09:00", close: "18:00" }],
      };
    }
  }
  return out;
}

type Props = {
  value: OpeningHours | null | undefined;
  onChange: (v: OpeningHours) => void;
};

export function OpeningHoursEditor({ value, onChange }: Props) {
  const hours = normalizeOpeningHours(value);

  const update = (day: DayKey, patch: Partial<OpeningDay>) => {
    onChange({ ...hours, [day]: { ...hours[day], ...patch } });
  };
  const updateRange = (day: DayKey, idx: number, patch: Partial<OpeningRange>) => {
    const ranges = hours[day].ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    update(day, { ranges });
  };
  const addRange = (day: DayKey) => {
    update(day, { ranges: [...hours[day].ranges, { open: "14:00", close: "18:00" }] });
  };
  const removeRange = (day: DayKey, idx: number) => {
    const ranges = hours[day].ranges.filter((_, i) => i !== idx);
    update(day, { ranges: ranges.length ? ranges : [{ open: "09:00", close: "18:00" }] });
  };
  const copyToAll = (day: DayKey) => {
    const src = hours[day];
    const next = { ...hours };
    for (const k of DAY_KEYS) if (k !== day) next[k] = { closed: src.closed, ranges: src.ranges.map((r) => ({ ...r })) };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Horário de atendimento</Label>
        <span className="text-xs text-muted-foreground">Adicione um ou mais intervalos por dia.</span>
      </div>
      <div className="divide-y rounded-md border">
        {DAY_KEYS.map((day) => {
          const d = hours[day];
          return (
            <div key={day} className="grid gap-3 p-3 sm:grid-cols-[110px_auto_1fr_auto] sm:items-center">
              <div className="text-sm font-medium text-foreground">{DAY_LABELS[day]}</div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={!d.closed}
                  onCheckedChange={(v) => update(day, { closed: !v })}
                />
                {d.closed ? "Fechado" : "Aberto"}
              </label>

              <div className={`flex flex-wrap items-center gap-2 ${d.closed ? "opacity-40 pointer-events-none" : ""}`}>
                {d.ranges.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={r.open}
                      onChange={(e) => updateRange(day, idx, { open: e.target.value })}
                      className="h-9 w-[110px]"
                    />
                    <span className="text-xs text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={r.close}
                      onChange={(e) => updateRange(day, idx, { close: e.target.value })}
                      className="h-9 w-[110px]"
                    />
                    {d.ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeRange(day, idx)}
                        aria-label="Remover intervalo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => addRange(day)}
                >
                  <Plus className="h-3 w-3" /> Intervalo
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 justify-self-end px-2 text-xs text-muted-foreground"
                onClick={() => copyToAll(day)}
                title="Aplicar este horário aos demais dias"
              >
                <Copy className="h-3 w-3" /> Aplicar a todos
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
