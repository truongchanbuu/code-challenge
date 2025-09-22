import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware";
import type { LessonController } from "../controllers/lesson.controller";
import { validate } from "../middlewares/validator.middleware";
import { AssignLessonBodySchema } from "../types/lesson";

export class InstructorRoutes {
    public router: Router;

    constructor({ lessonController }: { lessonController: LessonController }) {
        this.router = Router();

        this.router.post(
            "/assignLesson",
            requireAuth,
            requireRoles("instructor"),
            validate.body(AssignLessonBodySchema),
            lessonController.assignLesson.bind(lessonController)
        );
    }
}
