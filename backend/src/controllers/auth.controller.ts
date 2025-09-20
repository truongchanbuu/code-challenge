import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    private authService: AuthService;
    constructor({ authService }: { authService: AuthService }) {
        this.authService = authService;
    }

    async createAccessCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { phoneNumber, email } = req.body;
            await this.authService.createAccessCode({
                phoneNumber,
                email,
            });

            return res.status(200).json({
                ok: true,
                data: {
                    phoneNumber,
                    email,
                },
                message: "If the phone exists, an access code has been sent.",
            });
        } catch (e) {
            console.error("error: ", e);
            next(e);
        }
    }

    async validateAccessCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { phoneNumber, accessCode, email } = req.body;
            const result = await this.authService.verifyAccessCode({
                phoneNumber,
                email,
                otp: accessCode,
            });

            res.status(200).json({
                ok: true,
                data: {
                    userId: result.user.userId,
                    phone: result.user.phone,
                    role: result.user.role,
                    tokens: result.tokens,
                },
            });
        } catch (e) {
            next(e);
        }
    }
}
