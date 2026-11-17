import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { fetchRecentReviews, UIReviewCard } from "@/lib/home-api";
import { SectionHeading } from "./SectionHeading";

export const ReviewsCarousel = () => {
  const [items, setItems] = useState<UIReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetchRecentReviews(6).then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, []);

  const pageSize = items.length === 1 ? 1 : 2;
  const visible = items.slice(idx, idx + pageSize);
  const canPrev = idx > 0;
  const canNext = idx + pageSize < items.length;

  return (
    <div>
      <SectionHeading
        title="O que dizem nossos usuários"
        description="Avaliações reais de quem já conhece e recomenda."
        action={
          <Link to="/#ofertas" className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">
            Ver todas as avaliações →
          </Link>
        }
      />
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        </div>
      ) : items.length ? (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {visible.map((r) => (
              <article key={r.id} className="rounded-2xl bg-card border border-border shadow-soft p-5">
                <header className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/10 grid place-items-center overflow-hidden shrink-0">
                    {r.author_avatar ? (
                      <img src={r.author_avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{r.author_name[0]?.toUpperCase() ?? "?"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-foreground truncate">{r.author_name}</span>
                      <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                    </div>
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <Star key={k} className={`h-3.5 w-3.5 ${k < Math.round(r.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                </header>
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed line-clamp-3">
                  {r.comment?.trim() ? r.comment : `Avaliou com ${Math.round(r.rating)} estrela${Math.round(r.rating) === 1 ? "" : "s"}.`}
                </p>
                <div className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  sobre {r.store_name}
                </div>
              </article>
            ))}
          </div>
          {items.length > 2 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 2))}
                disabled={!canPrev}
                className="h-8 w-8 rounded-full border border-border bg-card grid place-items-center disabled:opacity-40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(items.length / 2) }).map((_, k) => (
                  <span key={k} className={`h-1.5 rounded-full transition-all ${k === Math.floor(idx / 2) ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
                ))}
              </div>
              <button
                onClick={() => setIdx((i) => Math.min(Math.max(0, items.length - 2), i + 2))}
                disabled={!canNext}
                className="h-8 w-8 rounded-full border border-border bg-card grid place-items-center disabled:opacity-40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-10 text-center text-muted-foreground text-sm">
          Nenhuma avaliação ainda.
        </div>
      )}
    </div>
  );
};
