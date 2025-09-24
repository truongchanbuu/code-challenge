import { storage } from "@/utils/storage";
import { LessonsResponseSchema } from "../schema";
import { LessonSchema, type Lesson } from "@/schemas/lesson.schema";

const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function getLessons(params: {
  query?: string;
  pageSize?: number;
  cursor?: string | null;
}) {
  const queryParams = new URLSearchParams();
  if (params.query) queryParams.set("query", params.query);
  queryParams.set("pageSize", String(params.pageSize ?? 50));
  if (params.cursor) queryParams.set("cursor", params.cursor);

  const res = await fetch(
    `${API}/instructor/lessons?${queryParams.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storage.accessToken}`,
      },
    },
  );
  if (!res.ok) throw new Error(`GET /instructor/lessons ${res.status}`);
  const json = await res.json();

  if (Array.isArray(json?.data)) {
    json.data = json.data.map((d: any) => ({
      ...d,
      createdAt: d?.createdAt?.toDate?.()
        ? d.createdAt.toDate()
        : new Date(d.createdAt),
    }));
  }

  const parsed = LessonsResponseSchema.safeParse(json);
  console.log("Parsed lessons response:", JSON.stringify(parsed, null, 2));
  if (!parsed.success) {
    const valid: Lesson[] = [];
    let invalid = 0;
    for (const it of json?.data ?? []) {
      const one = LessonSchema.safeParse(it);
      if (one.success) valid.push(one.data);
      else invalid++;
    }

    return {
      data: valid,
      nextCursor: null as string | null,
      __invalidCount: invalid,
    };
  }
  return parsed.data;
}

export async function updateLesson(
  lessonId: string,
  input: Partial<Pick<Lesson, "title" | "description">>,
) {
  const res = await fetch(`${API}/instructor/lessons/${lessonId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Failed to update lesson");
  }
  const json = await res.json();
  const parsed = LessonSchema.safeParse({
    ...json.data,
    createdAt: json?.data?.createdAt?.toDate?.()
      ? json.data.createdAt.toDate()
      : new Date(json?.data?.createdAt),
  });
  if (!parsed.success) throw new Error("Invalid lesson payload");
  return parsed.data;
}

export async function createLesson(
  input: Pick<Lesson, "title" | "description">,
) {
  const res = await fetch(`${API}/instructor/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storage.accessToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Failed to create lesson");
  }
  const json = await res.json();
  const parsed = LessonSchema.safeParse({
    ...json.data,
    createdAt: json?.data?.createdAt?.toDate?.()
      ? json.data.createdAt.toDate()
      : new Date(json?.data?.createdAt),
  });
  if (!parsed.success) throw new Error("Invalid lesson payload");
  return parsed.data;
}

export async function deleteLesson(lessonId: string) {
  const res = await fetch(`${API}/instructor/lessons/${lessonId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${storage.accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Failed to delete lesson");
  }
  return { ok: true, lessonId };
}
