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
}
