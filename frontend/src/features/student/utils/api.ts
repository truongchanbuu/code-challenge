import type { User } from "@/schemas/user.schema";
import { storage } from "@/utils/storage";

export async function apiMe(): Promise<User> {
  const result = await fetch("/me", {
    credentials: "include",
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  if (!result.ok) throw new Error(`Failed to get profile.`);
  const json = await result.json();
  return json?.data;
}
