import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { StudentRoutes } from "./student.routes";
import { InstructorRoutes } from "./instructor.routes";
import { NotificationRoutes } from "./notification.routes";

export class ApiRoutes {
    private readonly router: Router;
    constructor(deps: {
        authRoutes: AuthRoutes;
        studentRoutes: StudentRoutes;
        instructorRoutes: InstructorRoutes;
        notificationRoutes: NotificationRoutes;
    }) {
        this.router = Router();

        this.router.use("/auth", deps.authRoutes.router);
        this.router.use("/students", deps.studentRoutes.router);
        this.router.use("/instructor", deps.instructorRoutes.router);
        this.router.use("/notifications", deps.notificationRoutes.router);
        this.router.use("/", deps.studentRoutes.router);
    }
}
