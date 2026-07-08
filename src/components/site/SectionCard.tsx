import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/** White card container with padded body and optional header — the workhorse of the light theme. */
export const SectionCard = ({
  eyebrow,
  title,
  description,
  action,
  className = "",
  bodyClassName = "",
  children,
}: Props) => {
  const hasHeader = eyebrow || title || description || action;
  return (
    <section className={`rounded-3xl border border-border bg-card shadow-card ${className}`}>
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 px-6 pb-4 pt-6 md:px-8">
          <div className="min-w-0">
            {eyebrow && <div className="label-eyebrow text-primary">{eyebrow}</div>}
            {title && (
              <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`px-6 py-6 md:px-8 ${bodyClassName}`}>{children}</div>
    </section>
  );
};
