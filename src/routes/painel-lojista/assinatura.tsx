import { createFileRoute } from "@tanstack/react-router";
import Assinatura from "@/pages/Assinatura";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/assinatura")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <Assinatura />
    </ProtectedRoute>
  ),
});
