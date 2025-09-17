import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    constructor(private authService: AuthService) {
        this.authService = authService;
    }

    createAccessCode(req: Request, res: Response) {
        this.authService.createAccessCode("");
    }
}
