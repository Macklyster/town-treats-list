import { createFileRoute } from "@tanstack/react-router";
import PainelFidelidadePage from "@/pages/PainelFidelidadePage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/fidelidade")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <PainelFidelidadePage />
    </ProtectedRoute>
  ),
});
