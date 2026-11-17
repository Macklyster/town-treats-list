import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

type Row = { id: string; name: string; city: string; instagram: string | null; facebook: string | null; tiktok: string | null; website: string | null };
const FIELDS = [
  { k: "instagram", label: "Instagram", ph: "@loja" },
  { k: "facebook", label: "Facebook", ph: "facebook.com/loja" },
  { k: "tiktok", label: "TikTok", ph: "@loja" },
  { k: "website", label: "Site", ph: "loja.com.br" },
] as const;

export function AdminStoreSocials({ onSaved }: { onSaved?: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("stores").select("id,name,city,instagram,facebook,tiktok,website").eq("approved", true).order("name")
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  const edit = (id: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const save = async (r: Row) => {
    setBusy(r.id);
    const changes = { instagram: r.instagram?.trim() || null, facebook: r.facebook?.trim() || null, tiktok: r.tiktok?.trim() || null, website: r.website?.trim() || null };
    const { error } = await supabase.from("stores").update(changes).eq("id", r.id);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.from("admin_audit_log").insert({ admin_id: data.user.id, store_id: r.id, section: "redes_sociais", changes });
      toast.success(`Redes de ${r.name} salvas`);
      onSaved?.();
    } else toast.error(error.message);
    setBusy(null);
  };

  const term = q.trim().toLowerCase();
  const list = rows.filter((r) => !term || r.name.toLowerCase().includes(term) || r.city.toLowerCase().includes(term));

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h3 className="font-semibold">Redes sociais das lojas</h3>
        <p className="text-sm text-muted-foreground">Aparecem nos textos de ofertas abaixo. Pode digitar @usuario ou o link completo.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar loja ou cidade" />
      </div>
      <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
        {list.map((r) => (
          <div key={r.id} className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">{r.name} <span className="text-muted-foreground">— {r.city}</span></p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {FIELDS.map((f) => (
                <Input key={f.k} aria-label={`${f.label} de ${r.name}`} placeholder={`${f.label}: ${f.ph}`} value={r[f.k] ?? ""} onChange={(e) => edit(r.id, { [f.k]: e.target.value })} />
              ))}
            </div>
            <Button size="sm" disabled={busy === r.id} onClick={() => save(r)}>Salvar</Button>
          </div>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">Nenhuma loja encontrada.</p>}
      </div>
    </Card>
  );
}
