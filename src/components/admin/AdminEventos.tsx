import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X, ExternalLink, Star, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { EVENT_KINDS, type EventKind, type EventStatus } from "@/lib/events-api";

type Row = {
  id: string;
  title: string;
  kind: EventKind;
  status: EventStatus;
  slug: string;
  starts_at: string;
  ends_at: string;
  city: string;
  featured: boolean;
  rejection_reason: string | null;
  store: { name: string } | null;
};

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR");

export const AdminEventos = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events" as any)
      .select(
        "id,title,kind,status,slug,starts_at,ends_at,city,featured,rejection_reason, store:stores(name)",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (r: Row) => {
    const { error } = await supabase.rpc("approve_event" as any, { p_id: r.id });
    if (error) return toast.error(error.message);
    toast.success("Evento aprovado");
    // Notify followers + city users
    supabase.functions
      .invoke("notify-event-approved", { body: { event_id: r.id } })
      .then(({ data, error: e }) => {
        if (e) toast.error("Falha ao notificar");
        else if (data?.success != null) toast.success(`Push enviado para ${data.success} usuário(s)`);
      });
    load();
  };

  const reject = async (id: string) => {
    if (!reason.trim()) return toast.error("Informe um motivo");
    const { error } = await supabase.rpc("reject_event" as any, { p_id: id, p_reason: reason.trim() });
    if (error) return toast.error(error.message);
    toast.success("Evento rejeitado");
    setRejecting(null);
    setReason("");
    load();
  };

  const toggleFeatured = async (r: Row) => {
    const { error } = await supabase
      .from("events" as any)
      .update({ featured: !r.featured } as any)
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const expire = async (id: string) => {
    const { error } = await supabase
      .from("events" as any)
      .update({ status: "expired" } as any)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Evento encerrado");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" /> Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Título</th>
                  <th>Loja</th>
                  <th>Tipo</th>
                  <th>Cidade</th>
                  <th>Início</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-medium text-foreground">
                      {r.title}
                      {r.rejection_reason && (
                        <div className="text-xs text-destructive">Motivo: {r.rejection_reason}</div>
                      )}
                    </td>
                    <td>{r.store?.name ?? "—"}</td>
                    <td className="text-xs">
                      {EVENT_KINDS.find((k) => k.value === r.kind)?.label ?? r.kind}
                    </td>
                    <td className="text-xs">{r.city}</td>
                    <td className="text-xs text-muted-foreground">{fmt(r.starts_at)}</td>
                    <td>
                      <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        {r.status !== "approved" && (
                          <Button size="sm" variant="accent" onClick={() => approve(r)}>
                            <Check className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                        )}
                        {r.status !== "rejected" &&
                          (rejecting === r.id ? (
                            <div className="inline-flex items-center gap-1">
                              <Input
                                autoFocus
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Motivo"
                                className="h-8 w-40"
                              />
                              <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                                OK
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setRejecting(r.id)}>
                              <X className="h-3.5 w-3.5" /> Rejeitar
                            </Button>
                          ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFeatured(r)}
                          title={r.featured ? "Remover destaque" : "Destacar"}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${r.featured ? "fill-accent text-accent" : ""}`}
                          />
                        </Button>
                        {r.status === "approved" && (
                          <Button size="sm" variant="ghost" onClick={() => expire(r.id)}>
                            Encerrar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/evento/${r.slug}`} target="_blank">
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
