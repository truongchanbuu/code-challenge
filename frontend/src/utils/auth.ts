import type { Role } from "@/schemas/user.schema";

export function getToken(): string | null {
  return (
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    null
  );
}

export function getRole(): Role | null {
  return (
    (sessionStorage.getItem("role") as Role) ||
    (localStorage.getItem("role") as Role) ||
    null
  );
}

export function clearAuth() {
  ["accessToken", "token", "role"].forEach((k) => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
}
