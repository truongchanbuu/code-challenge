import z from "zod";

export const AssignLessonSchema = z.object({
  title: z.string().min(3, "At least 3 characters"),
  description: z.string().max(1000, "Too long").optional().or(z.literal("")),
  studentPhones: z.array(z.string().min(6)).min(1, "Pick at least 1 student"),
});

export type AssignLessonInput = z.infer<typeof AssignLessonSchema>;

export type AssignModalResult = {
  ok: boolean;
  data?: {
    lessonId: string;
    assignedTo: number;
    skipped?: number;
    skippedPhones?: string[];
  };
  error?: { code?: string; message: string };
};
