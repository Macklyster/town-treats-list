import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";

type Props = {
  children: React.ReactNode;
  requireRole?: AppRole;
};

export const ProtectedRoute = ({ children, requireRole }: Props) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-20 text-center text-muted-foreground">Carregando…</div>
    );
  }
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (requireRole && !roles.includes(requireRole) && !roles.includes("admin")) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
