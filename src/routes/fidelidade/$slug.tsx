import { createFileRoute } from "@tanstack/react-router";
import FidelidadeLoja from "@/pages/FidelidadeLoja";

export const Route = createFileRoute("/fidelidade/$slug")({
  component: FidelidadeLoja,
});
