import type { Role } from "@/schemas/user.schema";
import type { StudentsQuery } from "../schemas/query.schema";

export const studentsKeys = {
  all: ["students"] as const,
  list: (query: StudentsQuery) => [...studentsKeys.all, "list", query] as const,
  detail: (phoneNumber: string) => [
    ...studentsKeys.all,
    "detail",
    { phoneNumber },
  ],
  infinite: (q: unknown) => ["students", "infinite", q] as const,
};

export const assignmentsKeys = {
  assignments: (phones: string[]) => [
    "instructor",
    "currentAssignments",
    phones.sort().join(","),
  ],
  studentAssignments: (phoneNumber?: string, email?: string) => [
    "student",
    "assignments",
    phoneNumber ?? email ?? "me",
  ],
};

export const lessonsKeys = {
  lessons: (params: { query?: string; pageSize: number } = { pageSize: 20 }) =>
    ["instructor", "lessons", params.query ?? "", params.pageSize] as const,
};

export const conversationsKeys = {
  allConversations: (userPhone: string, role: Role) => [
    "conversations",
    userPhone,
    role,
  ],
  history: (instructorPhone?: string, studentPhone?: string) => [
    "history",
    instructorPhone,
    studentPhone,
  ],
};
