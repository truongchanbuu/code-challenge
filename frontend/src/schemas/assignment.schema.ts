import z from "zod";

export const LessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
});

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().min(1),
  lesson: LessonSchema,
  status: z.enum(["assigned", "in_progress", "done"]),
  assignedAt: z.string().datetime(),
  dueAt: z.iso.datetime().optional(),
  submittedAt: z.iso.datetime().optional(),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  updatedAt: z.string().datetime(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
