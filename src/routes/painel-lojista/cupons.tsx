import { createFileRoute } from "@tanstack/react-router";
import Cupons from "@/pages/Cupons";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/cupons")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <Cupons />
    </ProtectedRoute>
  ),
});
