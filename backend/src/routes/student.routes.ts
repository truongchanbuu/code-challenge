import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware";
import { StudentController } from "../controllers/student.controller";

export class StudentRoutes {
    public router: Router;

    constructor(deps: { studentController: StudentController }) {
        this.router = Router();
        this.router.get(
            "/myLessons",
            requireAuth,
            requireRoles("student"),
            deps.studentController.myLessons.bind(deps.studentController)
        );

        this.router.post(
            "/markLessonDone",
            requireAuth,
            requireRoles("student"),
            deps.studentController.markDone.bind(deps.studentController)
        );
    }
}
