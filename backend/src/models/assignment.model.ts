import { z } from "zod";
import { PhoneSchema } from "./phone.model";
import { LessonIdSchema } from "./lesson.model";

export const AssignmentStatusSchema = z.enum(["assigned", "done"]);

export const AssignmentSchema = z
    .object({
        lessonId: LessonIdSchema,
        title: z.string().min(1).max(200).trim(),
        description: z.string().min(1).max(1000).trim(),
        status: AssignmentStatusSchema,
        assignedBy: PhoneSchema,
        assignedAt: z.coerce.date(),
        doneAt: z.coerce.date().nullable().optional(),
        updatedAt: z.coerce.date().optional().nullable(),
    })
    .superRefine((val, ctx) => {
        if (val.status === "done" && !val.doneAt) {
            ctx.addIssue({
                code: "custom",
                path: ["doneAt"],
                message: "doneAt is required when status is 'done'.",
            });
        }
        if (val.status === "assigned" && val.doneAt) {
            ctx.addIssue({
                code: "custom",
                path: ["doneAt"],
                message: "doneAt must be null while status is 'assigned'.",
            });
        }
        if (val.doneAt && val.doneAt < val.assignedAt) {
            ctx.addIssue({
                code: "custom",
                path: ["doneAt"],
                message: "doneAt cannot be before assignedAt.",
            });
        }
        if (val.updatedAt && val.updatedAt < val.assignedAt) {
            ctx.addIssue({
                code: "custom",
                path: ["updatedAt"],
                message: "updatedAt cannot be before assignedAt.",
            });
        }
    });

export type Assignment = z.infer<typeof AssignmentSchema>;
