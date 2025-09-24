import { z } from "zod";
import { PhoneSchema } from "./phone.model";

export const LessonIdSchema = z
    .string()
    .regex(/^L(\d+|_\d+_[a-z0-9]+)$/i, "invalid lessonId");

export const LessonSchema = z.object({
    lessonId: LessonIdSchema,
    title: z.string().min(1).max(200).trim(),
    description: z.string().min(1).max(1000).trim(),
    createdBy: PhoneSchema,
    createdAt: z.coerce.date(),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const CreateLessonInputSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(500).optional().default(""),
});
export type CreateLessonInput = z.infer<typeof CreateLessonInputSchema>;

export const UpdateLessonInputSchema = z
    .object({
        title: z.string().min(3).max(200).optional(),
        description: z.string().max(500).optional(),
    })
    .refine((v) => !!(v.title || v.description), {
        message: "At least one field must be provided.",
    });
export type UpdateLessonInput = z.infer<typeof UpdateLessonInputSchema>;

export const ListLessonsQuerySchema = z.object({
    query: z.string().optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().nullable().optional(),
});

export type ListLessonsQuery = z.infer<typeof ListLessonsQuerySchema>;
