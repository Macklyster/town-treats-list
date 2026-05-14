import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RatingStars } from "./RatingStars";

export type RatingSummaryData = {
  count: number;
  avg: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
};

export async function fetchOfferRatingSummary(offerId: string): Promise<RatingSummaryData> {
  const { data } = await supabase.rpc("offer_rating_summary", { p_offer_id: offerId });
  const d = (data ?? {}) as any;
  return {
    count: Number(d.count ?? 0),
    avg: Number(d.avg ?? 0),
    distribution: {
      "1": Number(d.distribution?.["1"] ?? 0),
      "2": Number(d.distribution?.["2"] ?? 0),
      "3": Number(d.distribution?.["3"] ?? 0),
      "4": Number(d.distribution?.["4"] ?? 0),
      "5": Number(d.distribution?.["5"] ?? 0),
    },
  };
}

export function RatingSummary({ offerId }: { offerId: string }) {
  const [data, setData] = useState<RatingSummaryData | null>(null);
  useEffect(() => {
    fetchOfferRatingSummary(offerId).then(setData);
  }, [offerId]);

  if (!data || data.count === 0) return null;
  const total = data.count;
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{data.avg.toFixed(1)}</div>
          <RatingStars value={data.avg} readOnly size={16} />
          <div className="mt-1 text-xs text-muted-foreground">
            {total} avaliaç{total === 1 ? "ão" : "ões"}
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const c = data.distribution[String(star) as "1"] ?? 0;
            const pct = total > 0 ? (c / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{c}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function InlineRating({ avg, count }: { avg: number; count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <RatingStars value={avg} readOnly size={12} />
      <span className="font-medium text-foreground">{avg.toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}
