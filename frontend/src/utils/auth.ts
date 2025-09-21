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

export function isJwt(t: string) {
  return t.split(".").length === 3;
}

export function getJwtExp(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64));
    return typeof json?.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export function isExpiredToken(token: string, skewSec = 10): boolean {
  if (!isJwt(token)) return false;
  const exp = getJwtExp(token);
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return now + skewSec >= exp;
}

export function getPayloadFromJWT(token: string) {
  const payloadBase64 = token.split(".")[1];
  const payloadJson = atob(payloadBase64);
  return JSON.parse(payloadJson);
}

export function redirectByRole(role: string) {
  return role === "instructor" ? "/instructor/dashboard" : "/student/dashboard";
}
