import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export class ProfileRoutes {
    public router: Router;
    constructor(deps: { profileController: ProfileController }) {
        this.router = Router();
        this.router.get(
            "/",
            requireAuth,
            deps.profileController.getProfile.bind(deps.profileController)
        );
        this.router.put(
            "/",
            requireAuth,
            deps.profileController.updateProfile.bind(deps.profileController)
        );
    }
}
