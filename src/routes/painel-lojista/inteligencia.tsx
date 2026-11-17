import { createFileRoute } from "@tanstack/react-router";
import Inteligencia from "@/pages/Inteligencia";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/inteligencia")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <Inteligencia />
    </ProtectedRoute>
  ),
});
