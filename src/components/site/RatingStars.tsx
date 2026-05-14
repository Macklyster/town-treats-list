import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  className?: string;
  readOnly?: boolean;
};

export function RatingStars({ value, onChange, size = 20, className, readOnly = false }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {stars.map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default",
            )}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                filled || half ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
