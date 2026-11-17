import { createFileRoute } from "@tanstack/react-router";
import { Navigate, useLocation } from "@/lib/router-compat";

function OfertasRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/${search}#ofertas`} replace />;
}

export const Route = createFileRoute("/ofertas/")({
  component: OfertasRedirect,
});
