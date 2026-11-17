import { createFileRoute } from "@tanstack/react-router";
import Notificacoes from "@/pages/Notificacoes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/perfil/notificacoes")({
  component: () => (
    <ProtectedRoute>
      <Notificacoes />
    </ProtectedRoute>
  ),
});
