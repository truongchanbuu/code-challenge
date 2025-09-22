import { AccessCodeRepo } from "../repos/access-code.repo";
import { AccessCode, AccessCodeType } from "../models/access-code.model";
import { UserRepo } from "../repos/user.repo";
import { AppError, ERROR_CODE } from "../config/error";
import { Notifier } from "../repos/notifier";
import { JwtService } from "./jwt.service";
import { expiresAtFromNow, toDate } from "../utils/date";
import {
    getAvailableTarget,
    getOtp6Code,
    hashHmacOtp,
    isExactOneTargetValue,
    normalizeTarget,
    verifyHmacOtp,
} from "../utils/access-code";
import { normalizePhone } from "../utils/phone";

export class AuthService {
    private readonly OTP_TTL_IN_MINS: number;
    private readonly OTP_MAX_ATTEMPTS: number;
    private readonly OTP_SECRET: Buffer;

    private readonly accessCodeRepo: AccessCodeRepo;
    private readonly userRepo: UserRepo;

    private readonly smsService: Notifier;
    private readonly emailService: Notifier;
    private readonly jwtService: JwtService;

    constructor({
        config,
        accessCodeRepo,
        userRepo,
        smsService,
        emailService,
        jwtService,
    }: {
        config: any;
        accessCodeRepo: AccessCodeRepo;
        userRepo: UserRepo;
        smsService: Notifier;
        emailService: Notifier;
        jwtService: JwtService;
    }) {
        this.OTP_TTL_IN_MINS = config?.sms?.otpTtlInMins ?? 5;
        this.OTP_MAX_ATTEMPTS = config?.sms?.otpMaxAttempts ?? 5;

        if (!config?.sms?.otpSecret || config?.sms?.otpSecret?.trim() === "") {
            throw new AppError(
                "No otp secret found.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
        this.OTP_SECRET = Buffer.from(config?.sms?.otpSecret, "hex");

        this.accessCodeRepo = accessCodeRepo;
        this.userRepo = userRepo;
        this.smsService = smsService;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    public async createAccessCode(payload: {
        phoneNumber?: string;
        email?: string;
    }) {
        try {
            const { phoneNumber, email } = payload;
            const isAvailableTarget = isExactOneTargetValue({
                phoneNumber,
                email,
            });

            if (!isAvailableTarget) {
                throw new AppError(
                    "Provide exactly one of phone or email",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            const { type, target: rawTarget } = getAvailableTarget({
                phoneNumber,
                email,
            });
            const target = normalizeTarget(type, rawTarget);
            const userId = await this.resolveUserId(type, target);

            const otp = getOtp6Code();
            if (process.env.NODE_ENV !== "production") {
                console.debug("[OTP]", otp);
            }
            const codeHash = hashHmacOtp(userId, otp, this.OTP_SECRET);

            const accessCode: AccessCode = {
                userId,
                type,
                target,
                phoneNumber: type === "phone" ? target : null,
                codeHash,
                status: "active",
                maxAttempts: this.OTP_MAX_ATTEMPTS,
                expiresAt: expiresAtFromNow(this.OTP_TTL_IN_MINS),
                sentAt: new Date(),
                consumedAt: null,
            };

            const accessCodeId =
                await this.accessCodeRepo.saveAccessCode(accessCode);
            try {
                if (type === "phone") {
                    await this.smsService.sendLoginCode(
                        target,
                        otp,
                        this.OTP_TTL_IN_MINS
                    );
                } else {
                    await this.emailService.sendLoginCode(
                        target,
                        otp,
                        this.OTP_TTL_IN_MINS
                    );
                }
            } catch (e) {
                await this.accessCodeRepo.expireCode(accessCodeId);
                throw new AppError(
                    type === "phone"
                        ? "SMS delivery failed"
                        : "Email delivery failed",
                    502,
                    ERROR_CODE.INTERNAL_ERROR
                );
            }
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to create access code",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    public async verifyAccessCode(payload: {
        phoneNumber?: string;
        email?: string;
        otp: string;
    }) {
        try {
            const { phoneNumber, email, otp } = payload;
            const isAvailableTarget = isExactOneTargetValue({
                phoneNumber,
                email,
            });

            if (!isAvailableTarget) {
                throw new AppError(
                    "Provide exactly one of phoneNumber or email",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            if (!otp || !/^\d{6}$/.test(otp)) {
                throw new AppError("Invalid code.", 400, ERROR_CODE.VALIDATION);
            }

            const { type, target: rawTarget } = getAvailableTarget({
                phoneNumber,
                email,
            });
            const target = normalizeTarget(type, rawTarget);

            const accessCode =
                await this.accessCodeRepo.getLatestActiveByTarget(type, target);
            if (!accessCode)
                throw new AppError(
                    "Code not found.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const { id, data } = accessCode;

            const expiresDate = toDate(data.expiresAt);
            if (expiresDate && expiresDate <= new Date()) {
                await this.accessCodeRepo.expireCode(id);
                throw new AppError("Code expired.", 400, ERROR_CODE.VALIDATION);
            }

            const ok = verifyHmacOtp(
                data.codeHash,
                data.userId,
                otp,
                this.OTP_SECRET
            );

            if (!ok) {
                const retry = await this.accessCodeRepo.incrementAttempts(
                    id,
                    1
                );

                if ((retry ?? 0) >= (data.maxAttempts ?? this.OTP_MAX_ATTEMPTS))
                    await this.accessCodeRepo.blockCode(id);

                throw new AppError(
                    "Code mismatch.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            const consumed = await this.accessCodeRepo.consumeActiveCode(id);
            if (!consumed)
                throw new AppError(
                    "Code already used or invalid.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const user = await this.userRepo.getUserById(data.userId);
            if (!user)
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.NOT_FOUND
                );

            if (data.type === "email") {
                await this.userRepo.updateUser(user.userId, {
                    ...user,
                    email: data.target,
                    emailVerified: true,
                    updatedAt: new Date(),
                });
            } else if (data.type === "phone") {
                const normalizedPhone = normalizePhone(data.target);
                if (!normalizedPhone) {
                    throw new AppError(
                        "Invalid phone.",
                        400,
                        ERROR_CODE.VALIDATION
                    );
                }
                await this.userRepo.updateUser(user.userId, {
                    ...user,
                    phoneNumber: normalizedPhone,
                    updatedAt: new Date(),
                });
            }

            const updated = await this.userRepo.getUserById(user.userId);
            if (!updated) throw new AppError("Missing update data.");

            await this.userRepo.trackLoginTime(updated.userId);
            const { accessToken, refreshToken } =
                this.jwtService.issueTokenPair({
                    userId: updated.userId,
                    role: updated.role,
                    phoneNumber: updated.phoneNumber,
                    email: updated.email,
                });

            return {
                user: {
                    userId: updated.userId,
                    phoneNumber: updated.phoneNumber,
                    email: updated.email,
                    role: updated.role,
                },
                tokens: { accessToken, refreshToken },
            };
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to verify access code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    private async resolveUserId(type: AccessCodeType, target: string) {
        const userId =
            type === "phone"
                ? await this.userRepo.getUserIdByPhone(target)
                : (await this.userRepo.getUserByEmail(target))?.userId;
        if (!userId) {
            throw new AppError("User not found", 404, ERROR_CODE.NOT_FOUND);
        }
        return userId;
    }
}
