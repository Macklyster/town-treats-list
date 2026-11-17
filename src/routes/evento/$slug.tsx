import { createFileRoute } from "@tanstack/react-router";
import EventoPublic from "@/pages/EventoPublic";
import { buildHead, eventMeta } from "@/lib/route-seo";

export const Route = createFileRoute("/evento/$slug")({
  loader: ({ params }) => eventMeta(params.slug),
  head: ({ loaderData }) => buildHead(loaderData),
  component: EventoPublic,
});
