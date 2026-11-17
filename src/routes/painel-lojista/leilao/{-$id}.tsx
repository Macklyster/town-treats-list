import { createFileRoute } from "@tanstack/react-router";
import LeilaoForm from "@/pages/LeilaoForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/painel-lojista/leilao/{-$id}")({
  component: () => (
    <ProtectedRoute requireRole="lojista">
      <LeilaoForm />
    </ProtectedRoute>
  ),
});
