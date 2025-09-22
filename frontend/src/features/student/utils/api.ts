import { AssignmentSchema, type Assignment } from "@/schemas/assignment.schema";
import type { User } from "@/schemas/user.schema";
import { storage } from "@/utils/storage";
import z from "zod";

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

export async function getAssignments(): Promise<Assignment[]> {
  const result = await fetch(`${API}/student/myLessons`, {
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });

  if (!result.ok) throw new Error(`GET /student/myLessons ${result.status}`);
  const json = await result.json();

  const raw = Array.isArray(json?.data) ? json.data : [];

  const parsed = z.array(AssignmentSchema).safeParse(raw);
  if (parsed.success) {
    return [...parsed.data].sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
    );
  } else {
    const valid: Assignment[] = [];
    let invalid = 0;
    for (const it of raw) {
      const one = AssignmentSchema.safeParse(it);
      if (one.success) valid.push(one.data);
      else invalid++;
    }

    valid.sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
    );

    (valid as any).__invalidCount = invalid;
    return valid;
  }
}

export async function apiMarkDone(lessonId: string): Promise<{
  lessonId: string;
  status: "done";
  updatedAt: string;
}> {
  const result = await fetch(`${API}/student/markLessonDone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(storage.accessToken
        ? { Authorization: `Bearer ${storage.accessToken}` }
        : {}),
    },
    body: JSON.stringify({ lessonId }),
  });
  if (!result.ok)
    throw new Error(`POST /student/markLessonDone ${result.status}`);
  const json = await result.json();
  return json?.data;
}
