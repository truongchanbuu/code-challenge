import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { validate } from "../middlewares/validator.middleware";
import { AddStudentSchema } from "../models/student.schema";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware";

export class StudentRoutes {
    public router: Router;

    constructor({
        studentController,
    }: {
        studentController: StudentController;
    }) {
        this.router = Router();

        this.router.put(
            "/:phoneNumber",
            requireAuth,
            requireRoles("instructor"),
            studentController.updateStudent.bind(studentController)
        );
        this.router.delete(
            "/:phoneNumber",
            requireAuth,
            requireRoles("instructor"),
            studentController.deleteStudent.bind(studentController)
        );

        this.router.post(
            "/",
            requireAuth,
            requireRoles("instructor"),
            validate.body(AddStudentSchema),
            studentController.addStudent.bind(studentController)
        );

        this.router.get(
            "/",
            requireAuth,
            requireRoles("instructor"),
            studentController.getStudents.bind(studentController)
        );
    }
}
