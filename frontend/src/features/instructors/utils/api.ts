import { storage } from "@/utils/storage";
import type { AddStudentResponse, StudentsPage } from "../schemas/api.schema";
import type { AddStudentValues } from "../schemas/student.schema";

const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function deleteStudent(phone: string): Promise<void> {
  const result = await fetch(`${API}/students/${encodeURIComponent(phone)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
  });

  if (!result.ok) throw new Error(await result.text());
}

export async function addStudent(
  data: AddStudentValues,
): Promise<AddStudentResponse> {
  const result = await fetch(`${API}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!result.ok) {
    let msg = "Failed to add user.";
    try {
      const j = await result.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return result.json();
}

export async function editStudent(
  phoneNumber: string,
  payload: any,
  signal?: AbortSignal,
) {
  const res = await fetch(`${API}/students/${phoneNumber}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    const msg = json?.error?.message ?? `Update failed (${res.status})`;
    throw new Error(msg);
  }

  return json;
}

export async function fetchStudentsPage({
  query,
  pageSize,
  sort,
  cursor,
  signal,
}: {
  query: string;
  pageSize: number;
  sort: string;
  cursor?: string | null;
  signal?: AbortSignal;
}): Promise<StudentsPage> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("pageSize", String(pageSize));
  params.set("sort", sort);
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${API}/students?${params.toString()}`, {
    method: "GET",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch students failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  if (!json?.ok || !json?.data) {
    throw new Error("Invalid response shape");
  }
  const { items, total, nextCursor } = json.data;
  return {
    items: items ?? [],
    total: total ?? 0,
    nextCursor: nextCursor ?? null,
  };
}
