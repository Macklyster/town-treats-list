/** Admin-defined SEO overrides; empty fields fall back to the automatic metadata. */
export type SeoEntityType = "store" | "category" | "offer" | "event";
export type SeoOverride = {
  title: string | null;
  description: string | null;
  keywords: string[] | null;
  image_url: string | null;
};
type MetaLike = { title: string; description: string; image?: string | null; keywords?: string[] };

export function fillCity(text: string, cityLabel?: string) {
  return text.replace(/\{cidade\}/gi, cityLabel ?? "sua cidade");
}

export function applySeoOverride<T extends MetaLike>(meta: T, o: SeoOverride | null | undefined, cityLabel?: string): T {
  if (!o) return meta;
  const t = o.title?.trim();
  const d = o.description?.trim();
  const kw = (o.keywords ?? []).map((k) => k.trim()).filter(Boolean);
  return {
    ...meta,
    title: t ? fillCity(t, cityLabel) : meta.title,
    description: d ? fillCity(d, cityLabel) : meta.description,
    image: o.image_url?.trim() || meta.image,
    ...(kw.length ? { keywords: kw.map((k) => fillCity(k, cityLabel)) } : {}),
  };
}

/** City-specific override beats the general one for the same entity. */
export function pickOverride<R extends SeoOverride & { city: string }>(rows: R[], city?: string): R | null {
  return rows.find((r) => city && r.city === city) ?? rows.find((r) => r.city === "") ?? null;
}
