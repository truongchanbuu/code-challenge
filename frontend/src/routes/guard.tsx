import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "@/schemas/user.schema";
import { clearAuth, getRole, getToken, redirectByRole } from "@/utils/auth";
import { isExpiredToken } from "@/utils/auth";

export function PublicOnly({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const role = getRole();
  if (token && !isExpiredToken(token)) {
    return <Navigate to={redirectByRole(role!)} replace />;
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children?: React.ReactNode }) {
  const loc = useLocation();
  const token = getToken();
  if (!token || isExpiredToken(token)) {
    clearAuth();
    return (
      <Navigate
        to="/login"
        replace
        state={{ next: loc.pathname + loc.search }}
        data-testid="guard-redirect"
      />
    );
  }
  return <>{children ?? <Outlet />}</>;
}

export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children?: React.ReactNode;
}) {
  const role = getRole();
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role))
    return <Navigate to={redirectByRole(role)} replace />;
  return <>{children ?? <Outlet />}</>;
}
