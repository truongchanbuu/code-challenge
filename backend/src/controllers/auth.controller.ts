import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { SetupAccountSchema } from "../models/student.schema";
import { StudentService } from "../services/student.service";

export class AuthController {
    private authService: AuthService;
    private studentService: StudentService;

    constructor(deps: {
        authService: AuthService;
        studentService: StudentService;
    }) {
        this.authService = deps.authService;
        this.studentService = deps.studentService;
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

            return res.status(200).json({
                ok: true,
                data: {
                    userId: result.user.userId,
                    phoneNumber: phoneNumber,
                    role: result.user.role,
                    tokens: result.tokens,
                },
            });
        } catch (e) {
            next(e);
        }
    }

    async setupAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = SetupAccountSchema.parse(req.body);
            const data = await this.studentService.setup(parsed);
            return res.status(200).json({ ok: true, data });
        } catch (e) {
            next(e);
        }
    }
}
