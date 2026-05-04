export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRLNumber = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

export const discountPct = (orig: number, promo: number) =>
  orig > 0 && promo < orig ? Math.round((1 - promo / orig) * 100) : 0;
