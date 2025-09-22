import { Response, NextFunction, Request } from "express";
import { ProfileService } from "../services/profile.service";
import { getAuthUser } from "../middlewares/auth.middleware";

export class ProfileController {
    private readonly profileService: ProfileService;
    constructor(deps: { profileService: ProfileService }) {
        this.profileService = deps.profileService;
    }

    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const authUser = getAuthUser(req, res);
            if (!authUser || !authUser.sub) {
                return res
                    .status(401)
                    .json({ ok: false, message: "Unauthorized" });
            }

            const user = await this.profileService.getMyProfile(authUser.sub);
            return res.status(200).json({ ok: true, data: user });
        } catch (e) {
            next(e);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const authUser = getAuthUser(req, res);
            if (!authUser || !authUser.sub) {
                return res
                    .status(401)
                    .json({ ok: false, message: "Unauthorized" });
            }

            const user = await this.profileService.updateProfile(
                authUser.sub,
                req.body
            );
            return res.status(200).json({ ok: true, data: user });
        } catch (e) {
            next(e);
        }
    }
}
