import { createFileRoute } from "@tanstack/react-router";
import MeusCupons from "@/pages/MeusCupons";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/meus-cupons/")({
  component: () => (
    <ProtectedRoute>
      <MeusCupons />
    </ProtectedRoute>
  ),
});
