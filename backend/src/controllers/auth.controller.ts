import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { SetupAccountSchema } from "../models/student.schema";
import { InstructorService } from "../services/instructor.service";
import { UserService } from "../services/user.service";
import { JwtService } from "../services/jwt.service";

export class AuthController {
    private readonly authService: AuthService;
    private readonly instructorService: InstructorService;
    private readonly userService: UserService;
    private readonly jwtService: JwtService;

    constructor(deps: {
        authService: AuthService;
        instructorService: InstructorService;
        userService: UserService;
        jwtService: JwtService;
    }) {
        this.authService = deps.authService;
        this.instructorService = deps.instructorService;
        this.userService = deps.userService;
        this.jwtService = deps.jwtService;
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
            const data = await this.instructorService.setup(parsed);
            return res.status(200).json({ ok: true, data });
        } catch (e) {
            next(e);
        }
    }

    async loginWithPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { password, username: usernameRaw } = req.body;
            const username = usernameRaw?.trim()?.toLowerCase() ?? "";

            if (!password || !username) {
                return res.status(400).json({
                    ok: false,
                    message: "Username & password are required.",
                });
            }

            const user = await this.userService.findUserByUsername(username);
            if (!user || !user.passwordHashed) {
                return res.status(401).json({
                    ok: false,
                    message: "Invalid username or password.",
                });
            }

            const match = await bcrypt.compare(password, user.passwordHashed);
            if (!match) {
                return res.status(401).json({
                    ok: false,
                    message: "Invalid username or password.",
                });
            }

            if (user.isBanned) {
                return res
                    .status(403)
                    .json({ ok: false, message: "Account is suspended." });
            }

            const { accessToken, refreshToken } =
                this.jwtService.issueTokenPair({
                    userId: user.userId,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                });

            await this.userService.trackLogin(user.userId);
            return res.status(200).json({
                ok: true,
                data: {
                    userId: user.userId,
                    role: user.role,
                    phoneNumber: user.phoneNumber ?? null,
                    tokens: { accessToken, refreshToken },
                },
            });
        } catch (e) {
            next(e);
        }
    }
}
