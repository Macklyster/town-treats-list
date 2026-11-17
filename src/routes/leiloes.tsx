import { createFileRoute } from "@tanstack/react-router";
import Leiloes from "@/pages/Leiloes";

export const Route = createFileRoute("/leiloes")({
  component: Leiloes,
});
