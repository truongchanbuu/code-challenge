import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { AccessCodeRepo } from "../repos/access-code.repo";
import { AccessCode, AccessCodeType } from "../models/access-code.model";
import { UserRepo } from "../repos/user.repo";
import { AppError, ERROR_CODE } from "../config/error";
import { OtpNotifier } from "../repos/notifier";
import { JwtService } from "./jwt.service";
import { toDate } from "../utils/date";
import {
    getAvailableTarget,
    isExactOneTargetValue,
    normalizeTarget,
} from "../utils/access-code";

export class AuthService {
    private readonly OTP_TTL_IN_MINS: number;
    private readonly OTP_MAX_ATTEMPTS: number;
    private readonly OTP_SECRET: Buffer;

    private readonly accessCodeRepo: AccessCodeRepo;
    private readonly userRepo: UserRepo;

    private readonly smsService: OtpNotifier;
    private readonly emailService: OtpNotifier;
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
        smsService: OtpNotifier;
        emailService: OtpNotifier;
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

            const otp = this.getOtp6Code();
            if (process.env.NODE_ENV !== "production") {
                console.debug("[OTP]", otp);
            }
            const codeHash = this.hashHmacOtp(userId, otp, this.OTP_SECRET);

            const accessCode: AccessCode = {
                userId,
                type,
                target,
                phone: type === "phone" ? target : null,
                codeHash,
                status: "active",
                maxAttempts: this.OTP_MAX_ATTEMPTS,
                expiresAt: this.expiresAtFromNow(),
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

            const ok = this.verifyHmacOtp(data.codeHash, data.userId, otp);
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

            await this.userRepo.trackLoginTime(user.userId);
            const { accessToken, refreshToken } =
                this.jwtService.issueTokenPair({
                    userId: user.userId,
                    role: user.role,
                    phone: user.phone,
                    email: user.email,
                });

            return {
                user: {
                    userId: user.userId,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
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

    private getOtp6Code() {
        return String(randomInt(0, 1_000_000)).padStart(6, "0");
    }

    private hashHmacOtp(
        userId: string,
        otp: string,
        key: Buffer = this.OTP_SECRET
    ) {
        return createHmac("sha256", key)
            .update(`${userId}:${otp}`)
            .digest("hex");
    }

    private verifyHmacOtp(
        codeHash: string,
        userId: string,
        otp: string,
        key: Buffer = this.OTP_SECRET
    ) {
        const calcHex = this.hashHmacOtp(userId, otp, key);
        const a = Buffer.from(codeHash, "hex");
        const b = Buffer.from(calcHex, "hex");
        return a.length === b.length && timingSafeEqual(a, b);
    }

    private expiresAtFromNow() {
        const ttlMs = this.OTP_TTL_IN_MINS * 60 * 1000;
        return new Date(Date.now() + ttlMs);
    }
}
