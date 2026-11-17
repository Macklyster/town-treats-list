import { createFileRoute } from "@tanstack/react-router";
import OfertasInvisiveis from "@/pages/OfertasInvisiveis";

export const Route = createFileRoute("/ofertas-invisiveis")({
  component: OfertasInvisiveis,
});
