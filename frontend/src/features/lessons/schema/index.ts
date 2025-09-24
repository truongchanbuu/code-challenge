import { LessonSchema } from "@/schemas/lesson.schema";
import z from "zod";

export const LessonsResponseSchema = z.object({
  data: z.array(LessonSchema),
  nextCursor: z.string().optional().nullable(),
});
