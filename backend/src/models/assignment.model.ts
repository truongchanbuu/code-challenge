import { z } from "zod";
import { PhoneSchema } from "./phone.model";

export const LessonIdSchema = z
    .string()
    .regex(/^L\d+$/, "lessonId must look like 'L123'");

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
        updatedAt: z.coerce.date(),
    })
    .superRefine((v, ctx) => {
        if (v.status === "done" && !v.doneAt) {
            ctx.addIssue({
                code: "custom",
                path: ["doneAt"],
                message: "doneAt is required when status is 'done'.",
            });
        }
        if (v.status === "assigned" && v.doneAt) {
            ctx.addIssue({
                code: "custom",
                path: ["doneAt"],
                message: "doneAt must be null while status is 'assigned'.",
            });
        }
        if (v.doneAt && v.doneAt < v.assignedAt) {
            ctx.addIssue({
                code: "custom",
                path: ["doneAt"],
                message: "doneAt cannot be before assignedAt.",
            });
        }
        if (v.updatedAt < v.assignedAt) {
            ctx.addIssue({
                code: "custom",
                path: ["updatedAt"],
                message: "updatedAt cannot be before assignedAt.",
            });
        }
    });

export type Assignment = z.infer<typeof AssignmentSchema>;
