import { Clock } from "lucide-react";
import { DAY_KEYS, normalizeOpeningHours, type DayKey, type OpeningHours } from "./OpeningHoursEditor";

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo e Feriado",
};

const JS_DAY_TO_KEY: Record<number, DayKey> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

function minutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isOpenNow(hours: OpeningHours, now = new Date()): { open: boolean; nextRange?: { day: DayKey; open: string } } {
  const today = JS_DAY_TO_KEY[now.getDay()]!;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const d = hours[today];
  if (d && !d.closed) {
    for (const r of d.ranges) {
      if (nowMin >= minutes(r.open) && nowMin < minutes(r.close)) {
        return { open: true };
      }
    }
  }
  // Find next opening
  for (let offset = 0; offset < 8; offset++) {
    const key = JS_DAY_TO_KEY[(now.getDay() + offset) % 7]!;
    const dd = hours[key];
    if (!dd || dd.closed) continue;
    for (const r of dd.ranges) {
      if (offset === 0 && minutes(r.open) <= nowMin) continue;
      return { open: false, nextRange: { day: key, open: r.open } };
    }
  }
  return { open: false };
}

export function hasOpeningHours(raw: any): boolean {
  if (!raw || typeof raw !== "object") return false;
  return DAY_KEYS.some((k) => raw[k]);
}

type Props = { value: any };

export function OpeningHoursDisplay({ value }: Props) {
  if (!hasOpeningHours(value)) return null;
  const hours = normalizeOpeningHours(value);
  const status = isOpenNow(hours);
  const today = JS_DAY_TO_KEY[new Date().getDay()];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status.open
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-primary" : "bg-muted-foreground/60"}`}
          />
          {status.open ? "Aberto agora" : "Fechado agora"}
        </span>
        {!status.open && status.nextRange && (
          <span className="text-xs text-muted-foreground">
            abre {status.nextRange.day === today ? "hoje" : DAY_LABELS[status.nextRange.day].toLowerCase()} às {status.nextRange.open}
          </span>
        )}
      </div>

      <ul className="grid gap-1 text-sm sm:grid-cols-2">
        {DAY_KEYS.map((day) => {
          const d = hours[day];
          const isToday = day === today;
          return (
            <li
              key={day}
              className={`flex items-baseline justify-between gap-3 rounded-md px-2 py-1 ${
                isToday ? "bg-primary/5 font-medium text-foreground" : "text-foreground/80"
              }`}
            >
              <span className="shrink-0">
                {DAY_LABELS[day]}
                {isToday && <span className="ml-1 text-[10px] uppercase tracking-wide text-primary">hoje</span>}
              </span>
              <span className={`text-right tabular-nums ${d.closed ? "text-muted-foreground" : ""}`}>
                {d.closed
                  ? "Fechado"
                  : d.ranges.map((r, i) => (
                      <span key={i}>
                        {i > 0 && <span className="text-muted-foreground"> · </span>}
                        {r.open}–{r.close}
                      </span>
                    ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
