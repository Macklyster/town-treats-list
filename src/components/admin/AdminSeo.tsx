import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fillCity, type SeoEntityType } from "@/lib/seo-overrides";

type Entity = { key: string; name: string; path: string };
type Row = { id: string; entity_type: string; entity_key: string; city: string; title: string | null; description: string | null; keywords: string[]; image_url: string | null };

const TYPES: { value: SeoEntityType; label: string }[] = [
  { value: "store", label: "Lojas" },
  { value: "category", label: "Categorias" },
  { value: "offer", label: "Anúncios (ofertas)" },
  { value: "event", label: "Eventos" },
];

async function loadEntities(type: SeoEntityType): Promise<Entity[]> {
  if (type === "store") {
    const { data } = await supabase.from("stores").select("slug,name").eq("approved", true).order("name");
    return (data ?? []).map((s) => ({ key: s.slug, name: s.name, path: `/loja/${s.slug}` }));
  }
  if (type === "category") {
    const { data } = await supabase.from("categories").select("slug,name").order("sort_order");
    return (data ?? []).map((c) => ({ key: c.slug, name: c.name, path: `/ofertas/{cidade}/${c.slug}` }));
  }
  if (type === "offer") {
    const { data } = await supabase.from("offers").select("id,title,store:stores(name)").eq("status", "approved").order("created_at", { ascending: false }).limit(500);
    return (data ?? []).map((o: any) => ({ key: o.id, name: `${o.title} — ${o.store?.name ?? ""}`, path: `/oferta/${o.id}` }));
  }
  const { data } = await supabase.from("events").select("slug,title").eq("status", "approved").order("starts_at", { ascending: false }).limit(500);
  return (data ?? []).map((e) => ({ key: e.slug, name: e.title, path: `/evento/${e.slug}` }));
}

export function AdminSeo() {
  const { user } = useAuth();
  const [type, setType] = useState<SeoEntityType>("store");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Entity | null>(null);
  const [city, setCity] = useState("");
  const [form, setForm] = useState({ title: "", description: "", keywords: "", image_url: "" });
  const [saving, setSaving] = useState(false);

  const reloadRows = async () => {
    const { data } = await supabase.from("seo_overrides").select("*");
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { void reloadRows(); }, []);
  useEffect(() => { setSelected(null); void loadEntities(type).then(setEntities); }, [type]);

  const current = selected ? rows.find((r) => r.entity_type === type && r.entity_key === selected.key && r.city === city.trim()) : undefined;
  useEffect(() => {
    setForm({ title: current?.title ?? "", description: current?.description ?? "", keywords: (current?.keywords ?? []).join(", "), image_url: current?.image_url ?? "" });
  }, [current?.id, selected?.key, city]);

  const filtered = useMemo(() => entities.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 50), [entities, search]);
  const custom = (key: string) => rows.some((r) => r.entity_type === type && r.entity_key === key);
  const duplicates = rows.filter((r) => form.title.trim() && r.title?.trim().toLowerCase() === form.title.trim().toLowerCase() && r.id !== current?.id);
  const keywords = form.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  const missing = keywords.filter((k) => !`${form.title} ${form.description}`.toLowerCase().includes(k.toLowerCase()));
  const previewTitle = fillCity(form.title || selected?.name || "", city || "Douradina/PR");
  const previewDesc = fillCity(form.description || "Texto automático do OfertasFly.", city || "Douradina/PR");

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const payload = { entity_type: type, entity_key: selected.key, city: type === "category" ? city.trim() : "", title: form.title.trim() || null, description: form.description.trim() || null, keywords, image_url: form.image_url.trim() || null, updated_by: user?.id ?? null };
    const { error } = await supabase.from("seo_overrides").upsert(payload, { onConflict: "entity_type,entity_key,city" });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar o SEO."); return; }
    toast.success("SEO salvo. Publique o site para o Google ler.");
    void reloadRows();
  };
  const reset = async () => {
    if (!current) return;
    const { error } = await supabase.from("seo_overrides").delete().eq("id", current.id);
    if (error) { toast.error("Não foi possível voltar ao automático."); return; }
    toast.success("Voltou ao texto automático.");
    void reloadRows();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Select value={type} onValueChange={(v) => setType(v as SeoEntityType)}>
          <SelectTrigger aria-label="Tipo de página"><SelectValue /></SelectTrigger>
          <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="max-h-[480px] space-y-1 overflow-auto">
          {filtered.map((e) => (
            <li key={e.key}>
              <button type="button" onClick={() => { setSelected(e); setCity(""); }} className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${selected?.key === e.key ? "bg-muted font-medium" : ""}`}>
                <span className="truncate">{e.name}</span>
                <Badge variant={custom(e.key) ? "default" : "outline"} className="shrink-0">{custom(e.key) ? "Personalizado" : "Automático"}</Badge>
              </button>
            </li>
          ))}
          {!filtered.length && <li className="text-sm text-muted-foreground">Nada encontrado.</li>}
        </ul>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        {!selected ? <p className="text-muted-foreground">Escolha um item ao lado para ajustar o SEO.</p> : (<>
          <h3 className="font-semibold">{selected.name}</h3>
          {type === "category" && (
            <div><label className="text-sm font-medium">Cidade (opcional — vazio vale para todas)</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Douradina" />
              <p className="mt-1 text-xs text-muted-foreground">Use {"{cidade}"} no texto para inserir o nome da cidade automaticamente.</p></div>
          )}
          <div><label className="text-sm font-medium">Título no Google</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Vazio = automático" />
            <p className={`text-xs ${form.title.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>{form.title.length}/60{form.title.length > 60 && " — longo demais, o Google vai cortar"}</p>
            {duplicates.length > 0 && <p className="text-xs text-destructive">Esse título já é usado em outra página.</p>}</div>
          <div><label className="text-sm font-medium">Descrição no Google</label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Vazio = automático" />
            <p className={`text-xs ${form.description.length > 160 || (form.description && form.description.length < 70) ? "text-destructive" : "text-muted-foreground"}`}>{form.description.length}/160{form.description && form.description.length < 70 && " — curta, tente 120 a 160"}</p></div>
          <div><label className="text-sm font-medium">Palavras-chave (separadas por vírgula)</label>
            <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="farmácia de plantão, desconto Douradina" />
            {missing.length > 0 && <p className="text-xs text-muted-foreground">Não aparecem no título nem na descrição: {missing.join(", ")}</p>}</div>
          <div><label className="text-sm font-medium">Imagem de compartilhamento (link, opcional)</label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>

          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Prévia no Google</p>
            <p className="text-xs text-muted-foreground">ofertasfly.com.br{fillCity(selected.path, "douradina-pr")}</p>
            <p className="text-lg text-highlight">{previewTitle.slice(0, 60)}{previewTitle.length > 60 && "…"}</p>
            <p className="text-sm text-muted-foreground">{previewDesc.slice(0, 160)}{previewDesc.length > 160 && "…"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            {current && <Button variant="outline" onClick={reset}>Voltar ao automático</Button>}
          </div>
        </>)}
      </div>
    </div>
  );
}
