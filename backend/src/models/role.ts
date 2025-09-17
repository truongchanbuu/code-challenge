import { z } from "zod";

export const RoleSchema = z.enum(["instructor", "student"]);
export type Role = z.infer<typeof RoleSchema>;
