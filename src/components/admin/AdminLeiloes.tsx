import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ExternalLink, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL, type AuctionStatus } from "@/lib/auction-api";

type Row = {
  id: string;
  title: string;
  status: AuctionStatus;
  share_token: string;
  starting_price: number;
  min_price: number;
  decrement_amount: number;
  decrement_interval_minutes: number;
  total_quantity: number;
  reserved_quantity: number;
  ends_at: string | null;
  store: { name: string } | null;
};

export const AdminLeiloes = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("auction_offers" as any)
      .select("id,title,status,share_token,starting_price,min_price,decrement_amount,decrement_interval_minutes,total_quantity,reserved_quantity,ends_at, store:stores(name)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, status: AuctionStatus) => {
    const { error } = await supabase.from("auction_offers" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Leilões de Oferta</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum leilão criado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Título</th>
                  <th>Loja</th>
                  <th>Status</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Encerra</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-medium text-foreground">{r.title}</td>
                    <td>{r.store?.name ?? "—"}</td>
                    <td><Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge></td>
                    <td className="text-xs text-muted-foreground">
                      {formatBRL(Number(r.starting_price))} → {formatBRL(Number(r.min_price))}
                      <br />-{formatBRL(Number(r.decrement_amount))}/{r.decrement_interval_minutes}min
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> {r.reserved_quantity}/{r.total_quantity}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {r.ends_at ? new Date(r.ends_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        {r.status !== "approved" && r.status !== "sold_out" && (
                          <Button size="sm" variant="accent" onClick={() => update(r.id, "approved")}>
                            <Check className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => update(r.id, "rejected")}>
                            <X className="h-3.5 w-3.5" /> Rejeitar
                          </Button>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => update(r.id, "expired")}>
                            Encerrar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/leilao/${r.share_token}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
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
