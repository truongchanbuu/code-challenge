import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { storage } from "@/utils/storage";
import type { Role } from "@/schemas/user.schema";

const homeByRole = (role: Role | null) =>
  role === "instructor" ? "/instructor/dashboard" : "/student/dashboard";

export function PublicOnly({ children }: { children: ReactNode }) {
  const token = storage.token;
  const role = storage.role;
  if (token) return <Navigate to={homeByRole(role)} replace />;
  return <>{children}</>;
}

function isExpiredJWT(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" && Date.now() / 1000 >= exp;
  } catch {
    return false;
  }
}

export function AuthGuard({ children }: { children?: React.ReactNode }) {
  const loc = useLocation();
  const token = storage.token;

  if (!token || isExpiredJWT(token)) {
    storage.clear();
    return (
      <Navigate
        to="/login"
        replace
        state={{ next: loc.pathname + loc.search }}
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
  const role = storage.role;
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={homeByRole(role)} replace />;
  return <>{children ?? <Outlet />}</>;
}
