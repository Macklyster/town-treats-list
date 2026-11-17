import { createFileRoute } from "@tanstack/react-router";
import LeilaoPublic from "@/pages/LeilaoPublic";

export const Route = createFileRoute("/leilao/$token")({
  component: LeilaoPublic,
});
