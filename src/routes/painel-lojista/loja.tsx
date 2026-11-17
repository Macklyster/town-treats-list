import { createFileRoute } from "@tanstack/react-router";
import LojaForm from "@/pages/LojaForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/loja")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <LojaForm />
    </ProtectedRoute>
  ),
});
