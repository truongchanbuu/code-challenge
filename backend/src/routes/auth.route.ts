import express, { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

export class AuthRoutes {
    constructor(
        public router: Router,
        private authController: AuthController
    ) {
        this.router = express.Router();

        this.router.post(
            "/createAccessCode",
            this.authController.createAccessCode
        );
    }
}
