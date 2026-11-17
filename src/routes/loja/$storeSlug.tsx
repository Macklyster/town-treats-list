import { createFileRoute } from "@tanstack/react-router";
import StorePage from "@/pages/StorePage";
import { buildHead, storeMeta } from "@/lib/route-seo";

export const Route = createFileRoute("/loja/$storeSlug")({
  loader: ({ params }) => storeMeta(params.storeSlug),
  head: ({ loaderData }) => buildHead(loaderData),
  component: StorePage,
});
