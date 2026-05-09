import { cn } from "@/lib/utils";

type Props = {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
};

export const StoreAvatar = ({ name, logoUrl, size = 28, className }: Props) => {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.42)) };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-muted-foreground font-semibold",
        className,
      )}
      style={style}
      aria-hidden="true"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`Logo ${name}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
};
