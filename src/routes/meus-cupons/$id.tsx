import { createFileRoute } from "@tanstack/react-router";
import MeuCupomDetalhe from "@/pages/MeuCupomDetalhe";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/meus-cupons/$id")({
  component: () => (
    <ProtectedRoute>
      <MeuCupomDetalhe />
    </ProtectedRoute>
  ),
});
