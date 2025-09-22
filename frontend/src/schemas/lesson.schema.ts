import z from "zod";

export const LessonIdSchema = z
  .string()
  .regex(/^L\d+$/, "lessonId must look like 'L123'");

export const LessonSchema = z.object({
  lessonId: LessonIdSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  createdAt: z.iso.date(),
});
