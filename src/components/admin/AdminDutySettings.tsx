import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Cat = { slug: string; name: string };

export const AdminDutySettings = () => {
  const [def, setDef] = useState("1");
  const [cats, setCats] = useState<Cat[]>([]);
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: c }, { data: l }] = await Promise.all([
        supabase.from("app_settings").select("duty_max_concurrent_default").eq("id", true).maybeSingle(),
        supabase.from("categories").select("slug,name").order("sort_order"),
        supabase.from("duty_category_limits").select("category_slug,max_concurrent"),
      ]);
      setDef(String((s as any)?.duty_max_concurrent_default ?? 1));
      setCats(c ?? []);
      setLimits(Object.fromEntries((l ?? []).map((r) => [r.category_slug, String(r.max_concurrent)])));
    })();
  }, []);

  const save = async () => {
    const d = Number(def);
    if (!Number.isInteger(d) || d < 1 || d > 50) return toast.error("Limite padrão deve ser entre 1 e 50.");
    setSaving(true);
    const { error } = await supabase.from("app_settings").update({ duty_max_concurrent_default: d } as any).eq("id", true);
    const upserts = Object.entries(limits)
      .filter(([, v]) => v.trim() !== "")
      .map(([slug, v]) => ({ category_slug: slug, max_concurrent: Math.min(50, Math.max(1, Number(v) || 1)) }));
    const removes = cats.map((c) => c.slug).filter((slug) => !limits[slug]?.trim());
    const r1 = upserts.length ? await supabase.from("duty_category_limits").upsert(upserts) : { error: null };
    const r2 = removes.length ? await supabase.from("duty_category_limits").delete().in("category_slug", removes) : { error: null };
    setSaving(false);
    if (error || r1.error || r2.error) return toast.error("Não foi possível salvar os limites de plantão.");
    toast.success("Limites de plantão salvos");
    return undefined;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plantões</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-md space-y-2">
          <Label htmlFor="duty_default">Lojas em plantão simultâneo (padrão por categoria e cidade)</Label>
          <Input id="duty_default" type="number" min={1} max={50} value={def} onChange={(e) => setDef(e.target.value)} />
          <p className="text-sm text-muted-foreground">
            Vale para todas as categorias sem limite próprio abaixo.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Limite por categoria (deixe vazio para usar o padrão)</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <div key={c.slug} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="truncate text-sm">{c.name}</span>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  placeholder={def}
                  className="h-8 w-20"
                  value={limits[c.slug] ?? ""}
                  onChange={(e) => setLimits((p) => ({ ...p, [c.slug]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar plantões"}</Button>
      </CardContent>
    </Card>
  );
};
