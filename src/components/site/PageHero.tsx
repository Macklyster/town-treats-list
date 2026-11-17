import { ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { ChevronRight } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

export type Crumb = { label: string; to?: string };

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleAsChild?: boolean;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  aside?: ReactNode;
  compact?: boolean;
};

/**
 * Dark hero-island — the shared page header for the OfertasFly Light theme.
 * Sits inside `container` with rounded-3xl and casts a soft violet glow.
 */
export const PageHero = ({ eyebrow, title, titleAsChild = false, subtitle, crumbs, actions, aside, compact }: Props) => {
  const Heading = titleAsChild ? Slot : "h1";
  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-[hsl(var(--hero-bg))] text-[hsl(var(--hero-fg))] shadow-pop ${
        compact ? "px-6 py-8 md:px-10 md:py-10" : "px-6 py-10 md:px-12 md:py-14"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-primary-mid/20 blur-3xl"
      />

      <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          {crumbs && crumbs.length > 0 && (
            <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[hsl(var(--hero-muted))]">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
                  {c.to ? (
                    <Link to={c.to} className="hover:text-[hsl(var(--hero-fg))]">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-[hsl(var(--hero-fg))]">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {eyebrow && (
            <span className="label-eyebrow inline-block rounded-full bg-primary/20 px-3 py-1 text-primary-light">
              {eyebrow}
            </span>
          )}

          <Heading
            className={`font-display font-medium tracking-tight ${
              compact ? "mt-3 text-3xl md:text-4xl" : "mt-4 text-4xl md:text-5xl"
            }`}
          >
            {title}
          </Heading>

          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm text-[hsl(var(--hero-muted))] md:text-base">{subtitle}</p>
          )}

          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        </div>

        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  );
};
