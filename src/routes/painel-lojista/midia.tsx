import { createFileRoute } from "@tanstack/react-router";
import Biblioteca from "@/pages/Biblioteca";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/midia")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <Biblioteca />
    </ProtectedRoute>
  ),
});
