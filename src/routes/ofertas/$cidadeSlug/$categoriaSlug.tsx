import { createFileRoute } from "@tanstack/react-router";
import CityOffers from "@/pages/CityOffers";
import { buildHead, cityMeta } from "@/lib/route-seo";

export const Route = createFileRoute("/ofertas/$cidadeSlug/$categoriaSlug")({
  loader: ({ params }) => cityMeta(params.cidadeSlug, params.categoriaSlug),
  head: ({ loaderData }) => buildHead(loaderData),
  component: CityOffers,
});
