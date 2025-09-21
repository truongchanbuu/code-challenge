import { AppError, ERROR_CODE } from "../config/error";
import { CreateUserDTO } from "../models/user.dto";
import { User } from "../models/user.model";
import { UserRepo } from "../repos/user.repo";
import { SortType } from "../types/db";
import { normalizePhone } from "../utils/phone";

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

    async listStudentsByInstructor({
        instructorPhone,
        query = "",
        pageSize = 20,
        sort = "username_asc",
        cursor = null,
    }: {
        instructorPhone: string;
        query?: string;
        page?: number;
        pageSize?: number;
        sort?: SortType;
        cursor?: string | null;
    }): Promise<{
        items: User[];
        total: number | null;
        nextCursor: string | null;
    }> {
        if (!instructorPhone?.trim()) {
            throw new AppError("Invalid phone.", 400, ERROR_CODE.VALIDATION);
        }

        const normalized = normalizePhone(instructorPhone);
        if (!normalized) {
            throw new AppError("Invalid phone.", 400, ERROR_CODE.VALIDATION);
        }

        const result = await this.userRepo.listStudentsByInstructor({
            instructorPhone: normalized,
            query,
            pageSize,
            sort,
            cursor,
        });

        return result;
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
