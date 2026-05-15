import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ExternalLink, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL, formatTime, type GeoOfferStatus } from "@/lib/geo-offer-api";

type Row = {
  id: string;
  title: string;
  status: GeoOfferStatus;
  share_token: string;
  promo_price: number;
  original_price: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  time_start: string;
  time_end: string;
  valid_from: string;
  valid_until: string | null;
  store: { name: string } | null;
};

export const AdminOfertasInvisiveis = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("geo_offers" as any)
      .select("id,title,status,share_token,promo_price,original_price,center_lat,center_lng,radius_meters,time_start,time_end,valid_from,valid_until, store:stores(name)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, status: GeoOfferStatus) => {
    const { error } = await supabase.from("geo_offers" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Ofertas Invisíveis</CardTitle></CardHeader>
      <CardContent>
        {loading ? <p>Carregando…</p> : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma oferta invisível criada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Título</th><th>Loja</th><th>Status</th><th>Preço</th>
                  <th>Local</th><th>Janela</th><th>Validade</th><th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-medium text-foreground">{r.title}</td>
                    <td>{r.store?.name ?? "—"}</td>
                    <td><Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge></td>
                    <td className="text-xs text-muted-foreground">
                      <span className="line-through">{formatBRL(Number(r.original_price))}</span><br />
                      <strong>{formatBRL(Number(r.promo_price))}</strong>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${r.center_lat},${r.center_lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                        <MapPin className="h-3 w-3" /> {r.radius_meters} m
                      </a>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(r.time_start)}–{formatTime(r.time_end)}</span>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {r.valid_from}{r.valid_until ? ` → ${r.valid_until}` : ""}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        {r.status !== "approved" && (
                          <Button size="sm" variant="accent" onClick={() => update(r.id, "approved")}><Check className="h-3.5 w-3.5" /> Aprovar</Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => update(r.id, "rejected")}><X className="h-3.5 w-3.5" /> Rejeitar</Button>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => update(r.id, "expired")}>Encerrar</Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/oferta-invisivel/${r.share_token}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
