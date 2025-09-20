import type { ApiResponse } from "@/schemas/api.schema";
import type { Student } from "@/schemas/user.schema";

export interface GetStudentsResponse extends ApiResponse<Student[]> {}
export interface AddStudentResponse extends ApiResponse<Student> {}
