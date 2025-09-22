import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export class NotificationRoutes {
    public router: Router;
    constructor(deps: { notificationController: NotificationController }) {
        this.router = Router();
        this.router.get(
            "/",
            requireAuth,
            deps.notificationController.list.bind(deps.notificationController)
        );
        this.router.get(
            "/unread-count",
            requireAuth,
            deps.notificationController.count.bind(deps.notificationController)
        );
        this.router.post(
            "/:id/read",
            requireAuth,
            deps.notificationController.markRead.bind(
                deps.notificationController
            )
        );
    }
}
