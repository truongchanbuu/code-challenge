import { Request, Response, NextFunction } from "express";
import { AppError, ERROR_CODE } from "../config/error";
import { User } from "../models/user.model";
import { UserService } from "../services/user.service";
import { CreateUserDTO } from "../models/user.dto";

export class AdminController {
    private readonly userService: UserService;

    constructor({ userService }: { userService: UserService }) {
        this.userService = userService;
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { phoneNumber, role, email, username } = req.body;
            const user: CreateUserDTO = {
                phoneNumber,
                role,
                email,
                username,
            };

            const createdUser = await this.userService.createUser(user);
            return res.status(201).json({
                ok: true,
                data: createdUser,
            });
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to create user.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
