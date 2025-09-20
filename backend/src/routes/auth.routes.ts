import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validator.middleware";
import { createOtpLimiter, verifyOtpLimiter } from "../libs/rate-limit";
import {
    CreateAccessCodeDTO,
    ValidateAccessCodeDTO,
} from "../models/access-code.dto";
import { SetupAccountSchema } from "../models/student.schema";

export class AuthRoutes {
    private authController: AuthController;
    public router: Router;

    constructor({ authController }: { authController: AuthController }) {
        this.router = Router();
        this.authController = authController;

        this.router.post(
            "/createAccessCode",
            validate.body(CreateAccessCodeDTO),
            createOtpLimiter,
            this.authController.createAccessCode.bind(this.authController)
        );

        this.router.post(
            "/validateAccessCode",
            validate.body(ValidateAccessCodeDTO),
            verifyOtpLimiter,
            this.authController.validateAccessCode.bind(this.authController)
        );

        this.router.post(
            "/setup-account",
            validate.body(SetupAccountSchema),
            this.authController.setupAccount.bind(this.authController)
        );
    }
}
