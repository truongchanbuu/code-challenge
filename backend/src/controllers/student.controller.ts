import { Request, Response } from "express";
import { StudentService } from "../services/student.service";
import { getAuthUser } from "../middlewares/auth.middleware";
import { AppError } from "../config/error";

export class StudentController {
    private readonly studentService: StudentService;
    constructor(deps: { studentService: StudentService }) {
        this.studentService = deps.studentService;
    }

    private auth(req: Request, res: Response) {
        const u = getAuthUser(req, res);
        return { uid: u.sub, phone: u.phoneNumber };
    }

    async myLessons(req: Request, res: Response) {
        try {
            const { phone } = this.auth(req, res);
            const data = await this.studentService.myLessons(phone);
            res.json({ ok: true, data });
        } catch (e) {
            this.err(res, e);
        }
    }

    async markDone(req: Request, res: Response) {
        try {
            const { phone } = this.auth(req, res);
            const lessonId = String(req.body?.lessonId || "").trim();
            if (!lessonId)
                return res.status(400).json({
                    ok: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "lessonId required",
                    },
                });

            const data = await this.studentService.markLessonDone(
                phone,
                lessonId
            );
            res.json({ ok: true, data });
        } catch (e) {
            this.err(res, e);
        }
    }

    async editProfile(req: Request, res: Response) {
        try {
            const { uid } = this.auth(req, res);
            const input = { name: req.body?.name, email: req.body?.email };
            const data = await this.studentService.editProfile(uid, input);
            res.json({ ok: true, data });
        } catch (e) {
            this.err(res, e);
        }
    }

    async me(req: Request, res: Response) {
        try {
            const { uid } = this.auth(req, res);
            const data = await this.studentService.me(uid);
            res.json({ ok: true, data });
        } catch (e) {
            this.err(res, e);
        }
    }

    private err(res: Response, e: any) {
        if (e instanceof AppError) {
            return res.status(e.statusCode ?? 400).json({
                ok: false,
                error: { code: e.code, message: e.message },
            });
        }

        return res.status(500).json({
            ok: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Internal server error",
            },
        });
    }
}
