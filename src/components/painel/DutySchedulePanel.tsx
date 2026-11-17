import { useEffect, useState } from "react";
import { ShieldPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelDuty, createDuty, formatDutyDate, listStoreDuties, type DutySchedule } from "@/lib/duty-api";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const DutySchedulePanel = ({ storeId }: { storeId: string }) => {
  const [catNames, setCatNames] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [items, setItems] = useState<DutySchedule[]>([]);
  const [saving, setSaving] = useState(false);

  const reload = () => listStoreDuties(storeId).then(setItems);

  useEffect(() => {
    supabase.from("categories").select("slug,name").order("sort_order").then(({ data }) => {
      const map: Record<string, string> = {};
      for (const c of data ?? []) map[c.slug] = c.name;
      setCatNames(map);
    });
    // Herda a categoria da loja: usa a categoria mais frequente entre suas ofertas
    supabase
      .from("offers")
      .select("category_slug")
      .eq("store_id", storeId)
      .then(({ data }) => {
        const counts = new Map<string, number>();
        for (const o of data ?? []) counts.set(o.category_slug, (counts.get(o.category_slug) ?? 0) + 1);
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (top) setCategory(top);
      });
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const preset = (kind: "tonight" | "weekend" | "week") => {
    const now = new Date();
    const s = new Date(now);
    const e = new Date(now);
    if (kind === "tonight") {
      s.setHours(18, 0, 0, 0);
      e.setDate(e.getDate() + 1);
      e.setHours(8, 0, 0, 0);
    } else if (kind === "weekend") {
      const toSat = (6 - now.getDay() + 7) % 7;
      s.setDate(now.getDate() + toSat);
      s.setHours(8, 0, 0, 0);
      e.setTime(s.getTime());
      e.setDate(s.getDate() + 2);
      e.setHours(8, 0, 0, 0);
    } else {
      s.setHours(8, 0, 0, 0);
      e.setTime(s.getTime());
      e.setDate(s.getDate() + 7);
    }
    setStarts(toLocalInput(s));
    setEnds(toLocalInput(e));
  };

  const submit = async () => {
    if (!category) return toast.error("Cadastre uma oferta primeiro para definir a categoria da loja.");
    if (!starts || !ends) return toast.error("Preencha início e término.");
    setSaving(true);
    const r = await createDuty(storeId, category, new Date(starts), new Date(ends));
    setSaving(false);
    if (!r.ok) return toast.error(r.message);
    toast.success(r.message);
    setStarts("");
    setEnds("");
    reload();
    return undefined;
  };

  const now = Date.now();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldPlus className="h-5 w-5 text-primary" /> Plantões
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Durante o período agendado sua loja aparece com a tag <strong>Aberto (Plantão)</strong>.
          {category && (
            <>
              {" "}Categoria: <strong>{catNames[category] ?? category}</strong> (herdada das suas ofertas).
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => preset("tonight")}>Hoje à noite</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => preset("weekend")}>Fim de semana</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => preset("week")}>Semana completa</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label>Início</Label>
            <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Término</Label>
            <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
          </div>
          <Button type="button" onClick={submit} disabled={saving}>{saving ? "Agendando…" : "Agendar"}</Button>
        </div>

        {items.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {items.map((d) => {
              const live = new Date(d.starts_at).getTime() <= now;
              return (
                <li key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <div className="font-medium">
                      {formatDutyDate(d.starts_at)} → {formatDutyDate(d.ends_at)}
                      {live && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">Em andamento</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{catNames[d.category_slug] ?? d.category_slug}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Cancelar plantão"
                    onClick={async () => {
                      if (await cancelDuty(d.id)) { toast.success("Plantão cancelado"); reload(); }
                      else toast.error("Não foi possível cancelar");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum plantão agendado.</p>
        )}
      </CardContent>
    </Card>
  );
};
