import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware";
import type { LessonController } from "../controllers/lesson.controller";
import { validate } from "../middlewares/validator.middleware";
import { AssignLessonBodySchema } from "../types/lesson";
import { InstructorController } from "../controllers/instructor.controller";
import { AddStudentSchema } from "../models/student.schema";
import {
    CreateLessonInputSchema,
    LessonIdSchema,
    ListLessonsQuerySchema,
    UpdateLessonInputSchema,
} from "../models/lesson.model";

export class InstructorRoutes {
    public router: Router;

    constructor({
        lessonController,
        instructorController,
    }: {
        lessonController: LessonController;
        instructorController: InstructorController;
    }) {
        this.router = Router();

        this.router.get(
            "/lessons",
            requireAuth,
            requireRoles("instructor"),
            validate.query(ListLessonsQuerySchema),
            lessonController.listLessons.bind(lessonController)
        );

        this.router.post(
            "/lessons",
            requireAuth,
            requireRoles("instructor"),
            validate.body(CreateLessonInputSchema),
            lessonController.createLesson.bind(lessonController)
        );

        this.router.get(
            "/lessons/:lessonId",
            requireAuth,
            requireRoles("instructor"),
            validate.params(LessonIdSchema),
            lessonController.getLesson.bind(lessonController)
        );

        this.router.put(
            "/lessons/:lessonId",
            requireAuth,
            requireRoles("instructor"),
            validate.params(LessonIdSchema),
            validate.body(UpdateLessonInputSchema),
            lessonController.updateLesson.bind(lessonController)
        );

        this.router.delete(
            "/lessons/:lessonId",
            requireAuth,
            requireRoles("instructor"),
            validate.params(LessonIdSchema),
            lessonController.deleteLesson.bind(lessonController)
        );

        this.router.post(
            "/assignLesson",
            requireAuth,
            requireRoles("instructor"),
            validate.body(AssignLessonBodySchema),
            lessonController.assignLesson.bind(lessonController)
        );

        this.router.post(
            "/students",
            requireAuth,
            requireRoles("instructor"),
            validate.body(AddStudentSchema),
            instructorController.addStudent.bind(instructorController)
        );

        this.router.get(
            "/students",
            requireAuth,
            requireRoles("instructor"),
            instructorController.getStudents.bind(instructorController)
        );

        this.router.get(
            "/currentAssignments",
            requireAuth,
            requireRoles("instructor"),
            instructorController.currentAssignments.bind(instructorController)
        );

        this.router.put(
            "/:phoneNumber",
            requireAuth,
            requireRoles("instructor"),
            instructorController.updateStudent.bind(instructorController)
        );

        this.router.delete(
            "/:phoneNumber",
            requireAuth,
            requireRoles("instructor"),
            instructorController.deleteStudent.bind(instructorController)
        );
    }
}
