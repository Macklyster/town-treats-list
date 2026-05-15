import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Users, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL, type Tier } from "@/lib/group-offers-api";

type Row = {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected" | "expired";
  share_token: string;
  duration_hours: number;
  ends_at: string | null;
  tiers: Tier[];
  original_price: number;
  store: { name: string } | null;
  participants: { count: number }[] | null;
};

export const AdminColetivas = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("group_offers" as any)
      .select(
        "id,title,status,share_token,duration_hours,ends_at,tiers,original_price, store:stores(name), participants:group_offer_participants(count)"
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, status: Row["status"]) => {
    const { error } = await supabase.from("group_offers" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OfertasFly Coletivas</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma coletiva criada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Título</th>
                  <th>Loja</th>
                  <th>Status</th>
                  <th>Faixas</th>
                  <th>Participantes</th>
                  <th>Encerra</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => {
                  const count = r.participants?.[0]?.count ?? 0;
                  return (
                    <tr key={r.id}>
                      <td className="py-3 font-medium text-foreground">{r.title}</td>
                      <td>{r.store?.name ?? "—"}</td>
                      <td>
                        <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                      </td>
                      <td className="text-xs text-muted-foreground">
                        De {formatBRL(r.original_price)} →{" "}
                        {(r.tiers ?? []).map((t) => `${t.min_people}+ ${formatBRL(t.price)}`).join(" / ")}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {count}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {r.ends_at ? new Date(r.ends_at).toLocaleString("pt-BR") : `${r.duration_hours}h após aprovar`}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          {r.status !== "approved" && (
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
                            <Link to={`/coletiva/${r.share_token}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
