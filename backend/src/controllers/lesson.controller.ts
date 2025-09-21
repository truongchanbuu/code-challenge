import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { LessonService } from "../services/lesson.service";
import { getAuthUser } from "../middlewares/auth.middleware";
import { AssignLessonBody, AssignLessonBodySchema } from "../types/lesson";

export class LessonController {
    private readonly lessonService: LessonService;

    constructor({ lessonService }: { lessonService: LessonService }) {
        this.lessonService = lessonService;
    }

    async assignLesson(req: Request, res: Response, next: NextFunction) {
        try {
            const user = getAuthUser(req, res);
            if (!user || user.role !== "instructor") {
                return res.status(403).json({
                    ok: false,
                    error: { code: "FORBIDDEN", message: "Forbidden" },
                });
            }

            const parsed = AssignLessonBodySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    ok: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid request body",
                        details: parsed.error.flatten(),
                    },
                });
            }

            const { lessonId, assignedTo, skipped, skippedPhones } =
                await this.lessonService.assignLesson(
                    user.sub,
                    parsed.data as AssignLessonBody
                );

            return res.status(201).json({
                ok: true,
                data: { lessonId, assignedTo, skipped, skippedPhones },
            });
        } catch (err) {
            next(err);
        }
    }
}
