import { createFileRoute } from "@tanstack/react-router";
import OfertaInvisivelForm from "@/pages/OfertaInvisivelForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/oferta-invisivel/{-$id}")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <OfertaInvisivelForm />
    </ProtectedRoute>
  ),
});
