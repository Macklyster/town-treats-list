export const LiveBadge = ({ label = "Ao vivo agora" }: { label?: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary-light))] px-3 py-1 text-xs font-medium text-primary">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-[pulse-dot_1.6s_ease-in-out_infinite] rounded-full bg-discount opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-discount" />
    </span>
    {label}
  </span>
);
