import { createFileRoute } from "@tanstack/react-router";
import Fidelidade from "@/pages/Fidelidade";

export const Route = createFileRoute("/fidelidade/")({
  component: Fidelidade,
});
