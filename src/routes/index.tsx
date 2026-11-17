import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "OfertasFly — Ofertas e cupons na sua cidade" },
    { name: "description", content: "Encontre ofertas, cupons, lojas e eventos na sua cidade com o OfertasFly. Economize nos comércios locais e descubra o FlyPontos." },
    { property: "og:title", content: "OfertasFly — Ofertas e cupons na sua cidade" },
    { property: "og:description", content: "Encontre ofertas, cupons, lojas e eventos na sua cidade com o OfertasFly. Economize nos comércios locais e descubra o FlyPontos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});
