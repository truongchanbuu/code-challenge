import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { StudentRoutes } from "./student.routes";

export class ApiRoutes {
    private readonly router: Router;
    private readonly authRoutes: AuthRoutes;
    private readonly studentRoutes: StudentRoutes;

    constructor(deps: {
        authRoutes: AuthRoutes;
        studentRoutes: StudentRoutes;
    }) {
        this.router = Router();
        this.authRoutes = deps.authRoutes;
        this.studentRoutes = deps.studentRoutes;

        this.router.use("/auth", this.authRoutes.router);
        this.router.use("/students", this.studentRoutes.router);
    }
}
