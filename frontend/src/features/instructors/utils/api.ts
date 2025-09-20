import type {
  AddStudentResponse,
  GetStudentsResponse,
} from "../schemas/api.schema";
import type { StudentsQuery } from "../schemas/query.schema";
import type { AddStudentValues } from "../schemas/student.schema";

const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function fetchStudents(
  q: StudentsQuery,
): Promise<GetStudentsResponse> {
  const params = new URLSearchParams({
    page: String(q.page),
    pageSize: String(q.pageSize),
    ...(q.sort ? { sort: q.sort } : {}),
  });

  const result = await fetch(`${API}/students?${params.toString()}`);
  if (!result.ok) throw new Error(await result.text());
  return result.json();
}

export async function deleteStudent(phone: string): Promise<void> {
  const result = await fetch(`${API}/students/${encodeURIComponent(phone)}`, {
    method: "DELETE",
  });

  if (!result.ok) throw new Error(await result.text());
}

export async function addStudent(
  data: AddStudentValues,
): Promise<AddStudentResponse> {
  const result = await fetch(`${API}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
