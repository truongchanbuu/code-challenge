import { Router } from "express";
import { StudentController } from "../controllers/student.controller";
import { validate } from "../middlewares/validator.middleware";
import { AddStudentSchema } from "../models/student.schema";

export class StudentRoutes {
    private studentController: StudentController;
    public router: Router;

    constructor({
        studentController,
    }: {
        studentController: StudentController;
    }) {
        this.router = Router();
        this.studentController = studentController;

        this.router.post(
            "/",
            validate.body(AddStudentSchema),
            this.studentController.addStudent.bind(this.studentController)
        );
    }
}
