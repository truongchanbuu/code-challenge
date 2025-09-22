import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware";
import type { LessonController } from "../controllers/lesson.controller";
import { validate } from "../middlewares/validator.middleware";
import { AssignLessonBodySchema } from "../types/lesson";
import { InstructorController } from "../controllers/instructor.controller";
import { AddStudentSchema } from "../models/student.schema";

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

        this.router.post(
            "/assignLesson",
            requireAuth,
            requireRoles("instructor"),
            validate.body(AssignLessonBodySchema),
            lessonController.assignLesson.bind(lessonController)
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
    }
}
