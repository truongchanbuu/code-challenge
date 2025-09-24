import type { User } from "@/schemas/user.schema";
import { storage } from "@/utils/storage";

const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function getProfile(): Promise<User> {
  const result = await fetch(`${API}/me`, {
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  if (!result.ok) throw new Error(`Failed to get profile.`);
  const json = await result.json();
  return json?.data;
}

export async function updateProfile(
  input: Pick<User, "username" | "email" | "phoneNumber">,
) {
  const res = await fetch("/api/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Failed to update profile");
  }
  const json = await res.json();
  return json.data;
}
