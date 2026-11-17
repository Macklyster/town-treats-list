import { createFileRoute } from "@tanstack/react-router";
import ColetivaForm from "@/pages/ColetivaForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/coletiva/{-$id}")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <ColetivaForm />
    </ProtectedRoute>
  ),
});
