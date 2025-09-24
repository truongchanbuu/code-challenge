import type { Request, Response, NextFunction } from "express";
import type { LessonService } from "../services/lesson.service";
import { getAuthUser } from "../middlewares/auth.middleware";
import type { AssignLessonBody } from "../types/lesson";
import type { ListLessonsQuery } from "../models/lesson.model";

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

            const body = req.body as AssignLessonBody;

            const { lessonId, assignedTo, skipped, skippedPhones } =
                await this.lessonService.assignLesson(user.sub, body);

            return res.status(201).json({
                ok: true,
                data: { lessonId, assignedTo, skipped, skippedPhones },
            });
        } catch (err) {
            next(err);
        }
    }

    async listLessons(req: Request, res: Response, next: NextFunction) {
        try {
            const user = getAuthUser(req, res);
            if (!user || user.role !== "instructor") {
                return res.status(403).json({
                    ok: false,
                    error: { code: "FORBIDDEN", message: "Forbidden" },
                });
            }

            const query = (req as any).validated?.query as ListLessonsQuery;
            const { data, nextCursor } = await this.lessonService.listLessons(
                user.sub,
                query
            );

            return res.status(200).json({
                ok: true,
                data,
                nextCursor: nextCursor ?? null,
            });
        } catch (err) {
            next(err);
        }
    }

    async createLesson(req: Request, res: Response, next: NextFunction) {
        try {
            const user = getAuthUser(req, res);
            if (!user || user.role !== "instructor") {
                return res.status(403).json({
                    ok: false,
                    error: { code: "FORBIDDEN", message: "Forbidden" },
                });
            }

            const created = await this.lessonService.createLesson(
                user.sub,
                req.body
            );

            return res.status(201).json({ ok: true, data: created });
        } catch (err) {
            next(err);
        }
    }

    async getLesson(req: Request, res: Response, next: NextFunction) {
        try {
            const user = getAuthUser(req, res);
            if (!user || user.role !== "instructor") {
                return res.status(403).json({
                    ok: false,
                    error: { code: "FORBIDDEN", message: "Forbidden" },
                });
            }

            const lessonId = req.params.lessonId as string;

            const lesson = await this.lessonService.getLesson(
                user.sub,
                lessonId
            );
            return res.status(200).json({ ok: true, data: lesson });
        } catch (err) {
            next(err);
        }
    }

    async updateLesson(req: Request, res: Response, next: NextFunction) {
        try {
            const user = getAuthUser(req, res);
            if (!user || user.role !== "instructor") {
                return res.status(403).json({
                    ok: false,
                    error: { code: "FORBIDDEN", message: "Forbidden" },
                });
            }

            const lessonId = req.params.lessonId as string;

            const updated = await this.lessonService.updateLesson(
                user.sub,
                lessonId,
                req.body
            );

            return res.status(200).json({ ok: true, data: updated });
        } catch (err) {
            next(err);
        }
    }

    async deleteLesson(req: Request, res: Response, next: NextFunction) {
        try {
            const user = getAuthUser(req, res);
            if (!user || user.role !== "instructor") {
                return res.status(403).json({
                    ok: false,
                    error: { code: "FORBIDDEN", message: "Forbidden" },
                });
            }

            const lessonId = req.params.lessonId as string;
            console.log("Deleting lesson with ID:", lessonId);

            const result = await this.lessonService.deleteLesson(
                user.sub,
                lessonId
            );
            return res.status(200).json({ ok: true, data: result });
        } catch (err) {
            next(err);
        }
    }
}
