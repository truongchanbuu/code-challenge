import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { StudentRoutes } from "./student.routes";
import { InstructorRoutes } from "./instructor.routes";
import { NotificationRoutes } from "./notification.routes";
import { ProfileRoutes } from "./profile.routes";
import { ChatRoutes } from "./chat.routes";

export class ApiRoutes {
    public router: Router;
    constructor(deps: {
        authRoutes: AuthRoutes;
        studentRoutes: StudentRoutes;
        instructorRoutes: InstructorRoutes;
        notificationRoutes: NotificationRoutes;
        profileRoutes: ProfileRoutes;
        chatRoutes: ChatRoutes;
    }) {
        this.router = Router();

        this.router.use("/auth", deps.authRoutes.router);
        this.router.use("/student", deps.studentRoutes.router);
        this.router.use("/instructor", deps.instructorRoutes.router);
        this.router.use("/notifications", deps.notificationRoutes.router);
        this.router.use("/me", deps.profileRoutes.router);
        this.router.use("/chat", deps.chatRoutes.router);
    }
}
