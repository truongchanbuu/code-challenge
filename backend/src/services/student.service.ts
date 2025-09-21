import bcrypt from "bcrypt";
import { AppError, ERROR_CODE } from "../config/error";
import { AddStudentDTO, UpdateStudentDTO } from "../models/student.schema";
import { OtpNotifier } from "../repos/notifier";
import { SetupTokenRepo } from "../repos/setup-token.repo";
import { UserRepo } from "../repos/user.repo";
import {
    generateSetupToken,
    hashSetupTokenRaw,
    sha256Hex,
} from "../utils/hash";
import { User } from "../models/user.model";
import { PhoneIndexRepo } from "../repos/phone-index.repo";
import { normalizePhone } from "../utils/phone";

export class StudentService {
    private readonly userRepo: UserRepo;
    private readonly phoneIndexRepo: PhoneIndexRepo;
    private readonly setupTokenRepo: SetupTokenRepo;
    private readonly tokenSecret: string;
    private readonly feUrl: string;
    private readonly emailService: OtpNotifier;
    private readonly bcryptSaltRounds: number;

    constructor(deps: {
        userRepo: UserRepo;
        phoneIndexRepo: PhoneIndexRepo;
        setupTokenRepo: SetupTokenRepo;
        emailService: OtpNotifier;
        config: any;
    }) {
        this.emailService = deps.emailService;
        this.userRepo = deps.userRepo;
        this.phoneIndexRepo = deps.phoneIndexRepo;
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
        try {
            const { token, username, password } = input;
            if (!token || !username || !password) {
                throw new AppError("Invalid input", 400, ERROR_CODE.VALIDATION);
            }

            const existingUser =
                await this.userRepo.getUserByUsername(username);
            if (existingUser)
                throw new AppError(
                    "Username is already in use.",
                    409,
                    ERROR_CODE.CONFLICT
                );

            const tokenHash = sha256Hex(`${this.tokenSecret}:${token}`);
            const setupToken =
                await this.setupTokenRepo.consumeByHash(tokenHash);
            const user = await this.userRepo.getUserById(setupToken.userId);
            if (!user)
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.NOT_FOUND
                );

            const saltRounds = this.bcryptSaltRounds;
            const passwordHashed = await bcrypt.hash(password, saltRounds);

            await this.userRepo.updateAfterAccountSetup(user.userId, {
                username,
                passwordHashed,
                emailVerified: true,
                updatedAt: new Date(),
            });

            return { setupCompleted: true };
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to setup student account.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getStudents() {
        try {
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get students.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async updateStudent(phoneNumber: string, dto: UpdateStudentDTO) {
        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            const userId = await this.phoneIndexRepo.getUserIdByPhone(
                normalizedPhone!
            );

            if (!userId) {
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.VALIDATION
                );
            }

            const payload: Partial<User> = {};
            if (dto.username !== undefined) payload.username = dto.username;
            if (dto.phoneNumber !== undefined)
                (payload as any).phoneNumber = dto.phoneNumber;
            if (dto.email !== undefined)
                payload.email = dto.email.toLowerCase().trim();

            const updated = await this.userRepo.updateUser(userId, payload);
            if (!updated) {
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.NOT_FOUND
                );
            }
            return updated;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get students.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async deleteStudent(phoneNumber: string, deletedBy: any) {
        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            const userId = await this.phoneIndexRepo.getUserIdByPhone(
                normalizedPhone!
            );

            if (!userId) {
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.VALIDATION
                );
            }

            const user = await this.userRepo.getUserById(userId);

            if (deletedBy && deletedBy.phoneNumber) {
                const deletedByPhone = deletedBy.phoneNumber;
                if (deletedByPhone !== user?.instructor) {
                    throw new AppError("Forbidden", 403, ERROR_CODE.FORBIDDEN);
                }
            }

            await this.userRepo.deleteUser(userId);
            await this.phoneIndexRepo.deletePhoneIndex(normalizedPhone!);
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to delete students.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
