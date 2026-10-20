import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Copy, Images, Pause, Pencil, Play, Plus, Ticket, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { duplicateOffer } from "@/lib/media-api";

type Store = { id: string; name: string; city: string; state: string; logo_url: string | null };
type Row = { id: string; title: string; status: string; kind: string; table: string; path: string; created_by_admin: boolean; created_at: string };

const KINDS = [
  { table: "offers", label: "Oferta", path: "oferta" },
  { table: "group_offers", label: "Coletiva", path: "coletiva" },
  { table: "auction_offers", label: "Leilão", path: "leilao" },
  { table: "geo_offers", label: "Invisível", path: "oferta-invisivel" },
  { table: "events", label: "Evento", path: "evento" },
] as const;

export function AdminManagedOffers() {
  const [params, setParams] = useSearchParams();
  const [stores, setStores] = useState<Store[]>([]);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const sel = params.get("store");

  useEffect(() => {
    supabase.from("stores").select("id,name,city,state,logo_url").eq("managed_offers", true).order("name")
      .then(({ data }) => setStores((data ?? []) as Store[]));
  }, []);

  const load = async () => {
    if (!sel) return setRows([]);
    const res = await Promise.all(
      KINDS.map((k) => (supabase.from(k.table as any) as any).select("id,title,status,created_by_admin,created_at").eq("store_id", sel)),
    );
    const all: Row[] = res.flatMap((r, i) =>
      ((r.data ?? []) as any[]).map((d) => ({ ...d, kind: KINDS[i].label, table: KINDS[i].table, path: KINDS[i].path })),
    );
    all.sort((a, b) => b.created_at.localeCompare(a.created_at));
    setRows(all);
  };
  useEffect(() => { load(); }, [sel]);

  const filtered = useMemo(
    () => stores.filter((s) => `${s.name} ${s.city}`.toLowerCase().includes(q.toLowerCase())),
    [stores, q],
  );
  const store = stores.find((s) => s.id === sel);

  const pause = async (r: Row) => {
    if (r.table !== "offers") return;
    const status = r.status === "paused" ? "approved" : "paused";
    const { error } = await supabase.from("offers").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };
  const remove = async (r: Row) => {
    if (!confirm(`Excluir "${r.title}"?`)) return;
    const { error } = await (supabase.from(r.table as any) as any).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Excluído"); load();
  };
  const dup = async (r: Row) => {
    try { await duplicateOffer(r.id); toast.success("Oferta duplicada"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">Lojas com o serviço ({stores.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Buscar por nome ou cidade" value={q} onChange={(e) => setQ(e.target.value)} />
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma loja. Ative o serviço em "Gestão de Loja".</p>
          )}
          <ul className="max-h-[60vh] space-y-1 overflow-auto">
            {filtered.map((s) => (
              <li key={s.id}>
                <Button
                  variant="ghost"
                  onClick={() => setParams({ tab: "gerenciadas", store: s.id })}
                  className={`h-auto w-full flex-col items-start px-3 py-2 text-left text-sm ${sel === s.id ? "bg-muted font-semibold" : ""}`}
                >
                  {s.name}<span className="block text-xs text-muted-foreground">{s.city}/{s.state}</span>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{store ? `Ofertas de ${store.name} (${rows.length})` : "Selecione uma loja"}</CardTitle>
          {store && (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline"><Link to={`/admin/loja/${store.id}/cupons`}><Ticket className="mr-1 h-4 w-4" /> Cupons</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to={`/admin/loja/${store.id}/midia`}><Images className="mr-1 h-4 w-4" /> Mídias</Link></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Nova oferta</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {KINDS.map((k) => (
                  <DropdownMenuItem key={k.path} asChild><Link to={`/admin/loja/${store.id}/${k.path}`}>{k.label}</Link></DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {store && rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma oferta cadastrada ainda.</p>}
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.table + r.id} className="flex flex-wrap items-center gap-2 py-2">
                <Badge variant="secondary">{r.kind}</Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
                <Badge variant="outline">{r.status}</Badge>
                {r.created_by_admin && <Badge className="text-[10px]">Gerenciada pela OfertasFly</Badge>}
                <Button asChild size="icon" variant="ghost" className="h-8 w-8"><Link to={`/admin/loja/${sel}/${r.path}/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                {r.table === "offers" && (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => pause(r)}>
                      {r.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => dup(r)}><Copy className="h-4 w-4" /></Button>
                  </>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
