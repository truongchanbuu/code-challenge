import { z } from "zod";

export const RoleSchema = z.enum(["instructor", "student", "admin"]);
export type Role = z.infer<typeof RoleSchema>;
