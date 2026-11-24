import { createFileRoute } from "@tanstack/react-router";
import { loadLocalSeo } from "@/lib/local-seo.functions";
import { absoluteUrl, citySlug } from "@/lib/slug";

export const Route = createFileRoute("/api/public/events-sitemap")({ server: { handlers: {
  GET: async () => {
    const { cities } = await loadLocalSeo({ data: { type: "agenda" } });
    const entries = cities.map((city) => `<url><loc>${absoluteUrl(`/eventos/${citySlug(city)}`)}</loc></url>`).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
  },
} } });
