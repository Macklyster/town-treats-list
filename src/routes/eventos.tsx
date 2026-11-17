import { createFileRoute } from "@tanstack/react-router";
import Eventos from "@/pages/Eventos";

export const Route = createFileRoute("/eventos")({
  component: Eventos,
});
