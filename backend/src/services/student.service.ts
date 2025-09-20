import bcrypt from "bcrypt";
import { AppError, ERROR_CODE } from "../config/error";
import { AddStudentDTO } from "../models/student.schema";
import { OtpNotifier } from "../repos/notifier";
import { SetupTokenRepo } from "../repos/setup-token.repo";
import { UserRepo } from "../repos/user.repo";
import {
    generateSetupToken,
    hashSetupTokenRaw,
    sha256Hex,
} from "../utils/hash";

export class StudentService {
    private readonly userRepo: UserRepo;
    private readonly setupTokenRepo: SetupTokenRepo;
    private readonly tokenSecret: string;
    private readonly feUrl: string;
    private readonly emailService: OtpNotifier;
    private readonly bcryptSaltRounds: number;

    constructor(deps: {
        userRepo: UserRepo;
        setupTokenRepo: SetupTokenRepo;
        emailService: OtpNotifier;
        config: any;
    }) {
        this.emailService = deps.emailService;
        this.userRepo = deps.userRepo;
        this.setupTokenRepo = deps.setupTokenRepo;
        this.tokenSecret = deps.config.tokenSecret;
        this.feUrl = deps.config.feUrl;
        this.bcryptSaltRounds = 10;
    }

    async addStudent(
        email: string,
        phoneNumber: string,
        username: string,
        instructor: string
    ) {
        try {
            const student: AddStudentDTO = {
                role: "student",
                username,
                email,
                phoneNumber,
                instructor,
                emailVerified: false,
            };

            const createdUser = await this.userRepo.createUser(student);
            if (!createdUser || !createdUser.userId) {
                throw new AppError(
                    "Failed to create user",
                    500,
                    ERROR_CODE.INTERNAL_ERROR
                );
            }

            const raw = generateSetupToken(32);
            const hash = hashSetupTokenRaw(raw, this.tokenSecret);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

            await this.setupTokenRepo.create({
                userId: createdUser.userId,
                email,
                phoneNumber,
                tokenHash: hash,
                purpose: "account_setup",
                status: "active",
                createdAt: now,
                expiresAt,
            });

            const link = `${this.feUrl}/account-setup?token=${raw}`;
            await this.emailService.sendAccountSetupInvite(email, link);

            return {
                ok: true,
                data: {
                    userId: createdUser.userId,
                    inviteSent: true,
                    expiresAt,
                },
            };
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to add student.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async setup(input: { token: string; username: string; password: string }) {
        const { token, username, password } = input;
        if (!token || !username || !password) {
            throw new AppError("Invalid input", 400, ERROR_CODE.VALIDATION);
        }

        const tokenHash = sha256Hex(`${this.tokenSecret}:${token}`);
        const setupToken = await this.setupTokenRepo.consumeByHash(tokenHash);
        const user = await this.userRepo.getUserById(setupToken.userId);
        if (!user)
            throw new AppError("User not found.", 404, ERROR_CODE.NOT_FOUND);

        const saltRounds = this.bcryptSaltRounds;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        console.log(`service: ${passwordHash} - ${username}`);

        await this.userRepo.updateAfterAccountSetup(user.userId, {
            username,
            passwordHash,
            emailVerified: true,
            updatedAt: new Date(),
        });

        return { setupCompleted: true };
    }
}
