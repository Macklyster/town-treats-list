import { Eye, Flame, MessageCircle } from "lucide-react";
import {
  SocialProof,
  shouldShowViewersNow,
  shouldShowViewsToday,
} from "@/lib/social-proof";

type Props = {
  sp?: SocialProof;
  variant?: "compact" | "detailed";
  className?: string;
};

export const SocialProofBadge = ({ sp, variant = "compact", className }: Props) => {
  const showViews = shouldShowViewsToday(sp);
  const showNow = shouldShowViewersNow(sp);
  if (!sp || (!showViews && !showNow)) return null;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground ${className ?? ""}`}
      >
        {showViews && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
            <Eye className="h-3 w-3" />
            {sp.views_today} viram hoje
          </span>
        )}
        {showNow && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
            <Flame className="h-3 w-3" />
            {sp.viewers_now} agora
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm ${className ?? ""}`}
    >
      {showViews && (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <Eye className="h-4 w-4 text-accent-strong" />
          <strong>{sp.views_today}</strong>
          <span className="text-muted-foreground">pessoas viram hoje</span>
        </span>
      )}
      {sp.contacts_today > 0 && (
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <MessageCircle className="h-4 w-4 text-accent-strong" />
          <strong>{sp.contacts_today}</strong>
          <span className="text-muted-foreground">clicaram para falar hoje</span>
        </span>
      )}
      {showNow && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">
          <Flame className="h-4 w-4" />
          <strong>{sp.viewers_now}</strong>
          <span>vendo agora</span>
        </span>
      )}
    </div>
  );
};
