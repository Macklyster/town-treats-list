export const SITE_URL = "https://ofertasfly.com.br";

const STRIP_DIACRITICS = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const slugify = (s: string) =>
  STRIP_DIACRITICS(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type CityLike = { city: string; state: string };

export const citySlug = (c: CityLike): string => {
  const base = slugify(c.city);
  const uf = (c.state || "").toLowerCase();
  return uf ? `${base}-${uf}` : base;
};

/** Try to recover { city, state } from a slug given a list of known cities. */
export const matchCityFromSlug = (
  slug: string,
  cities: CityLike[]
): CityLike | null => {
  const target = slug.toLowerCase();
  return (
    cities.find((c) => citySlug(c) === target) ??
    cities.find((c) => slugify(c.city) === target) ??
    null
  );
};

/** Pretty city label "City/UF". */
export const cityLabel = (c: CityLike) =>
  c.state ? `${c.city}/${c.state.toUpperCase()}` : c.city;

export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
