import { createFileRoute } from "@tanstack/react-router";
import PainelLojista from "@/pages/PainelLojista";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <PainelLojista />
    </ProtectedRoute>
  ),
});
