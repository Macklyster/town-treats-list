/**
 * Server-only environment lookup for ported backend handlers.
 * Secrets come from the runtime; Supabase URL/anon key fall back to the public build values.
 */
const PUBLIC_FALLBACKS: Record<string, string | undefined> = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

export function env(name: string): string | undefined {
  const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
  return fromProcess ?? PUBLIC_FALLBACKS[name];
}
