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
