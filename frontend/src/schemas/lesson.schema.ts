import z from "zod";
import { PhoneSchema } from "./phone.schema";

export const LessonIdSchema = z
  .string()
  .regex(/^L(\d+|_\d+_[a-z0-9]+)$/i, "invalid lessonId");

export const LessonSchema = z.object({
  lessonId: LessonIdSchema,
  title: z.string().min(3).max(200),
  description: z.string().max(500).optional().default(""),
  createdBy: PhoneSchema,
  createdAt: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
});

export type Lesson = z.infer<typeof LessonSchema>;
