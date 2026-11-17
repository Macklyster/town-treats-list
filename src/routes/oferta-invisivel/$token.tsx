import { createFileRoute } from "@tanstack/react-router";
import OfertaInvisivelPublic from "@/pages/OfertaInvisivelPublic";

export const Route = createFileRoute("/oferta-invisivel/$token")({
  component: OfertaInvisivelPublic,
});
