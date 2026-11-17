import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <ProtectedRoute requireRole="admin">
      <Admin />
    </ProtectedRoute>
  ),
});
