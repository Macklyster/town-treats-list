import { createFileRoute } from "@tanstack/react-router";
import PainelAjuda from "@/pages/PainelAjuda";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/ajuda")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <PainelAjuda />
    </ProtectedRoute>
  ),
});
