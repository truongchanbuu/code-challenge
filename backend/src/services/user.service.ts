import { AppError, ERROR_CODE } from "../config/error";
import { CreateUserDTO } from "../models/user.dto";
import { User } from "../models/user.model";
import { UserRepo } from "../repos/user.repo";

export class UserService {
    private readonly userRepo: UserRepo;
    constructor({ userRepo }: { userRepo: UserRepo }) {
        this.userRepo = userRepo;
    }

    async createUser(user: CreateUserDTO): Promise<User> {
        try {
            const createdUser = await this.userRepo.createUser(user);

            if (!createdUser) {
                throw new AppError(
                    "Cannot create user.",
                    500,
                    ERROR_CODE.INTERNAL_ERROR
                );
            }

            return createdUser;
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

    async findUserByEmail(email: string) {
        try {
            return await this.userRepo.getUserByEmail(email);
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get user by email.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async findUserByUsername(username: string) {
        try {
            return await this.userRepo.getUserByUsername(username);
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get user by username.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async trackLogin(userId: string) {
        try {
            await this.userRepo.trackLoginTime(userId);
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to track user login.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
