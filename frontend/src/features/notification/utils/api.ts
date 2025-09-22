import { storage } from "@/utils/storage";

export async function apiCount() {
  const r = await fetch("/api/notifications/unread-count", {
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return json?.data?.unread ?? 0;
}

export async function apiList() {
  const r = await fetch("/api/notifications?limit=20", {
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return Array.isArray(json?.data) ? json.data : [];
}

export async function apiRead(id: string) {
  await fetch(`/api/notifications/${id}/read`, {
    method: "POST",
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
}
