import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { StudentRoutes } from "./student.routes";
import { InstructorRoutes } from "./lesson.routes";

export class ApiRoutes {
    private readonly router: Router;
    constructor(deps: {
        authRoutes: AuthRoutes;
        studentRoutes: StudentRoutes;
        instructorRoutes: InstructorRoutes;
    }) {
        this.router = Router();

        this.router.use("/auth", deps.authRoutes.router);
        this.router.use("/students", deps.studentRoutes.router);
        this.router.use("/", deps.studentRoutes.router);
    }
}
