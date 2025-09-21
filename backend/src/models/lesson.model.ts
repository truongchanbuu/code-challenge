import { z } from "zod";
import { PhoneSchema } from "./phone.model";

export const LessonIdSchema = z
    .string()
    .regex(/^L\d+$/, "lessonId must look like 'L123'");

export const LessonSchema = z.object({
    lessonId: LessonIdSchema,
    title: z.string().min(1).max(200).trim(),
    description: z.string().min(1).max(1000).trim(),
    createdBy: PhoneSchema,
    createdAt: z.coerce.date(),
});

export type Lesson = z.infer<typeof LessonSchema>;
