import { createFileRoute } from "@tanstack/react-router";
import EventoForm from "@/pages/EventoForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/evento/{-$id}")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <EventoForm />
    </ProtectedRoute>
  ),
});
