export type StoreSocials = { instagram?: string | null; facebook?: string | null; tiktok?: string | null; website?: string | null };

const handle = (v: string, host: RegExp) => {
  const t = v.trim().replace(host, "").replace(/^@/, "").split(/[/?#]/)[0] ?? "";
  return t ? `@${t}` : "";
};
const strip = (v: string) => v.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");

/** Linhas de redes sociais para textos de divulgação; vazio quando não há redes. */
export function formatSocials(s: StoreSocials): string[] {
  const out: string[] = [];
  if (s.instagram?.trim()) { const h = handle(s.instagram, /^(https?:\/\/)?(www\.)?instagram\.com\//i); if (h) out.push(`📸 Siga: ${h}`); }
  if (s.facebook?.trim()) { const v = strip(s.facebook); out.push(`👍 ${v.includes(".") ? v : `facebook.com/${v.replace(/^@/, "")}`}`); }
  if (s.tiktok?.trim()) { const h = handle(s.tiktok, /^(https?:\/\/)?(www\.)?tiktok\.com\//i); if (h) out.push(`🎵 TikTok: ${h}`); }
  if (s.website?.trim()) out.push(`🌐 ${strip(s.website)}`);
  return out;
}
