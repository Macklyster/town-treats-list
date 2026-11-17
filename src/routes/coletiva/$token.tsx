import { createFileRoute } from "@tanstack/react-router";
import ColetivaPublic from "@/pages/ColetivaPublic";

export const Route = createFileRoute("/coletiva/$token")({
  component: ColetivaPublic,
});
