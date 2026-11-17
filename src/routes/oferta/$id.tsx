import { createFileRoute } from "@tanstack/react-router";
import OfferDetail from "@/pages/OfferDetail";
import { buildHead, offerMeta } from "@/lib/route-seo";

export const Route = createFileRoute("/oferta/$id")({
  loader: ({ params }) => offerMeta(params.id),
  head: ({ loaderData }) => buildHead(loaderData),
  component: OfferDetail,
});
