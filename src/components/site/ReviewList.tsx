import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RatingStars } from "./RatingStars";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
  photos: { id: string; image_url: string }[];
};

export function ReviewList({ offerId }: { offerId: string }) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("offer_reviews")
        .select("id, rating, comment, created_at, user_id, photos:offer_review_photos(id, image_url)")
        .eq("offer_id", offerId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      const rows = (data ?? []) as any[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        profileMap = new Map(
          (profiles ?? []).map((p: any) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
        );
      }
      setReviews(
        rows.map((r) => ({
          ...r,
          profile: profileMap.get(r.user_id) ?? null,
          photos: r.photos ?? [],
        })),
      );
      setLoading(false);
    })();
  }, [offerId]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando avaliações…</p>;
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há avaliações. Seja o primeiro a contar como foi.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-6">
        {reviews.map((r) => {
          const firstName = (r.profile?.full_name ?? "").split(" ")[0] || "Cliente";
          return (
            <li key={r.id} className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground">
                {r.profile?.avatar_url ? (
                  <img src={r.profile.avatar_url} alt={firstName} className="h-full w-full object-cover" />
                ) : (
                  firstName[0]
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{firstName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <RatingStars value={r.rating} readOnly size={14} className="mt-1" />
                {r.comment && (
                  <p className="mt-2 text-sm text-foreground whitespace-pre-line">{r.comment}</p>
                )}
                {r.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.photos.map((ph) => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => setLightbox(ph.image_url)}
                        className="h-20 w-20 overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={ph.image_url}
                          alt="Foto do cliente"
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Foto" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </>
  );
}
