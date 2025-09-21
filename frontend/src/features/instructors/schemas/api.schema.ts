import type { ApiResponse } from "@/schemas/api.schema";
import type { Student } from "@/schemas/user.schema";

export interface GetStudentsResponse extends ApiResponse<Student[]> {}
export interface AddStudentResponse extends ApiResponse<Student> {}
export type SortType = "username_asc" | "username_desc" | "createdAt_desc";

export type StudentsPage = {
  items: Student[];
  total: number;
  nextCursor: string | null;
};
