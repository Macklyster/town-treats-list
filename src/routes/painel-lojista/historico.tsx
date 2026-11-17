import { createFileRoute } from "@tanstack/react-router";
import Historico from "@/pages/Historico";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/historico")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <Historico />
    </ProtectedRoute>
  ),
});
