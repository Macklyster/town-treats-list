import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RatingStars } from "@/components/site/RatingStars";

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  user_id: string;
  offer: { id: string; title: string } | null;
  store: { name: string } | null;
  photos: { id: string; image_url: string }[];
};

export const AdminReviews = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("offer_reviews")
      .select(
        "id, rating, comment, status, created_at, user_id, offer:offers(id,title), store:stores(name), photos:offer_review_photos(id, image_url)",
      )
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("offer_reviews").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Avaliação aprovada" : "Avaliação rejeitada");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliações</CardTitle>
        <div className="mt-2 flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "accent" : "outline"}
              onClick={() => setTab(t)}
            >
              {t === "pending" ? "Pendentes" : t === "approved" ? "Aprovadas" : "Rejeitadas"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem avaliações nesta lista.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{r.store?.name ?? "—"}</span>
                      <span>•</span>
                      <span className="truncate">{r.offer?.title ?? "—"}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <RatingStars value={r.rating} readOnly size={14} />
                      <Badge variant="secondary">{r.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm whitespace-pre-line text-foreground">{r.comment}</p>
                    )}
                    {r.photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.photos.map((p) => (
                          <a
                            key={p.id}
                            href={p.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-16 w-16 overflow-hidden rounded border bg-muted"
                          >
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.status !== "approved" && (
                      <Button size="sm" variant="accent" onClick={() => setStatus(r.id, "approved")}>
                        Aprovar
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
                        Rejeitar
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
