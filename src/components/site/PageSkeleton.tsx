import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lightweight page placeholder shown while a lazy-loaded route chunk is
 * downloading. It mimics the page shell (top bar + content blocks) so the
 * transition feels instant instead of showing a "Carregando…" text flash.
 */
export const PageSkeleton = () => (
  <div className="min-h-screen bg-background" aria-hidden="true">
    {/* Header placeholder */}
    <div className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="hidden gap-4 md:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
    {/* Content placeholder */}
    <div className="container py-8">
      <Skeleton className="mb-4 h-8 w-2/3 max-w-md" />
      <Skeleton className="mb-8 h-4 w-1/2 max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
    <span className="sr-only">Carregando conteúdo…</span>
  </div>
);
