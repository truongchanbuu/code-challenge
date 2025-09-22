import { z } from "zod";
import { AssignmentSchema } from "./assignment.schema";
import { PhoneSchema } from "./phone.schema";
import { LessonSchema } from "./lesson.schema";

export const RoleSchema = z.enum(["student", "instructor"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserStatusSchema = z.enum([
  "online",
  "offline",
  "assigned",
  "done",
]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const BaseUserSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(1, "username is required"),
    phoneNumber: z.string().min(1, "phoneNumber is required"),
    role: RoleSchema,
    instructor: PhoneSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime().optional(),
    status: UserStatusSchema.optional(),
  })
  .strict();

export type BaseUser = z.infer<typeof BaseUserSchema>;

export const StudentSchema = BaseUserSchema.extend({
  role: z.literal("student"),
  currentLesson: LessonSchema.optional(),
  assignments: z.array(AssignmentSchema),
}).strict();

export type Student = z.infer<typeof StudentSchema>;

export const InstructorSchema = BaseUserSchema.extend({
  role: z.literal("instructor"),
}).strict();

export type Instructor = z.infer<typeof InstructorSchema>;

export const UserSchema = z.discriminatedUnion("role", [
  StudentSchema,
  InstructorSchema,
]);

export type User = z.infer<typeof UserSchema>;
