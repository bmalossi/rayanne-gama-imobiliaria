import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function ProtectedRoute({
  children,
  requiredRole
}: {
  children: React.ReactNode;
  requiredRole?: "admin";
}) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Only show full-screen loader on initial load (when we don't have a user yet)
  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="gold-label">Carregando painel...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
