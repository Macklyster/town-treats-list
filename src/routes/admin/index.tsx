import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Administração | OfertasFly" },
    { name: "description", content: "Painel de gestão de lojas, ofertas e divulgação do OfertasFly." },
    { property: "og:title", content: "Administração | OfertasFly" },
    { property: "og:description", content: "Painel de gestão de lojas, ofertas e divulgação do OfertasFly." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: () => (
    <ProtectedRoute requireRole="admin">
      <Admin />
    </ProtectedRoute>
  ),
});
