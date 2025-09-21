import z from "zod";

export type AssignLessonInput = {
    title: string;
    description?: string;
    studentPhones: string[];
};

export const AssignLessonBodySchema = z.object({
    title: z.string().min(1).max(120).trim(),
    description: z.string().max(1000).trim().optional(),
    studentPhones: z.array(z.string()).min(1),
});

export type AssignLessonBody = z.infer<typeof AssignLessonBodySchema>;
