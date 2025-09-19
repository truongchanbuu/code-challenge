import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware";
import { AdminController } from "../controllers/admin.controller";
import { validate } from "../middlewares/validator.middleware";
import { CreateUserDTOSchema } from "../models/user.dto";

export class AdminRoutes {
    public router: Router;
    private adminController: AdminController;

    constructor({ adminController }: { adminController: AdminController }) {
        this.router = Router();
        this.adminController = adminController;

        this.router.get("/health", (_req, res) => {
            res.json({ ok: true });
        });

        this.router.post(
            "/user",
            // requireAuth,
            // requireRoles("admin"),
            validate.body(CreateUserDTOSchema),
            this.adminController.createUser.bind(this.adminController)
        );
    }
}
