import { createFileRoute } from "@tanstack/react-router";
import Favoritos from "@/pages/Favoritos";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/favoritos")({
  component: () => (
    <ProtectedRoute>
      <Favoritos />
    </ProtectedRoute>
  ),
});
