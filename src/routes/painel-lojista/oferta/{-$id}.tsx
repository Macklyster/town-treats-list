import { createFileRoute } from "@tanstack/react-router";
import OfertaForm from "@/pages/OfertaForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/oferta/{-$id}")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <OfertaForm />
    </ProtectedRoute>
  ),
});
