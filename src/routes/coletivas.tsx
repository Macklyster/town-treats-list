import { createFileRoute } from "@tanstack/react-router";
import Coletivas from "@/pages/Coletivas";

export const Route = createFileRoute("/coletivas")({
  component: Coletivas,
});
