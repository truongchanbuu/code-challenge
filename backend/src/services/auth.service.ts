import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { normalizePhone } from "../utils/phone";
import { AccessCodeRepo } from "../repos/access-code.repo";
import { AccessCode } from "../models/access-code.model";
import { UserRepo } from "../repos/user.repo";
import { AppError, ERROR_CODE } from "../config/error";
import { OtpNotifier } from "../repos/notifier";
import { JwtService } from "./jwt.service";

export class AuthService {
    private readonly OTP_TTL_IN_MINS: number;
    private readonly OTP_MAX_ATTEMPTS: number;
    private readonly OTP_SECRET: Buffer;

    private readonly accessCodeRepo: AccessCodeRepo;
    private readonly userRepo: UserRepo;

    private readonly smsService: OtpNotifier;
    private readonly jwtService: JwtService;

    constructor({
        config,
        accessCodeRepo,
        userRepo,
        smsService,
        jwtService,
    }: {
        config: any;
        accessCodeRepo: AccessCodeRepo;
        userRepo: UserRepo;
        smsService: OtpNotifier;
        jwtService: JwtService;
    }) {
        this.OTP_TTL_IN_MINS = config?.sms?.OTP_TTL_IN_MINS ?? 5;
        this.OTP_MAX_ATTEMPTS = config?.sms?.OTP_MAX_ATTEMPTS ?? 5;
        if (
            !config?.sms?.OTP_SECRET ||
            config?.sms?.OTP_SECRET?.trim() === ""
        ) {
            throw new AppError(
                "No otp secret found.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
        this.OTP_SECRET = Buffer.from(config?.sms?.OTP_SECRET, "hex");

        this.accessCodeRepo = accessCodeRepo;
        this.userRepo = userRepo;
        this.smsService = smsService;
        this.jwtService = jwtService;
    }

    public async createAccessCode(phone: string) {
        try {
            const normalizedPhone = normalizePhone(phone);
            if (!normalizedPhone) {
                throw new AppError("Invalid data.", 400, ERROR_CODE.VALIDATION);
            }

            const otp = this.getOtp6Code();
            const codeHash = this.hashHmacOtp(
                normalizedPhone,
                otp,
                this.OTP_SECRET
            );

            const userId =
                await this.userRepo.getUserIdByPhone(normalizedPhone);

            if (!userId)
                throw new AppError("User not found", 404, ERROR_CODE.NOT_FOUND);

            const accessCode: AccessCode = {
                userId,
                codeHash,
                status: "active",
                phone: normalizedPhone,
                maxAttempts: this.OTP_MAX_ATTEMPTS,
                expiresAt: this.expiresAtFromNow(),
                sentAt: new Date(),
                consumedAt: null,
            };

            const accessCodeId =
                await this.accessCodeRepo.saveAccessCode(accessCode);
            try {
                await this.smsService.sendLoginCode(
                    normalizedPhone,
                    otp,
                    this.OTP_TTL_IN_MINS
                );
            } catch (e) {
                await this.accessCodeRepo.expireCode(accessCodeId);
                throw new AppError(
                    "SMS delivery failed",
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

    public async verifyAccessCode(phone: string, otp: string) {
        try {
            const normalized = normalizePhone(phone);
            if (!normalized)
                throw new AppError("Invalid data.", 400, ERROR_CODE.VALIDATION);

            const accessCode =
                await this.accessCodeRepo.getLatestActiveByPhone(normalized);
            if (!accessCode)
                throw new AppError(
                    "Code not found.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const { id, data } = accessCode;
            if (data.expiresAt <= new Date()) {
                await this.accessCodeRepo.expireCode(id);
                throw new AppError("Code expired.", 400, ERROR_CODE.VALIDATION);
            }

            const ok = this.verifyHmacOtp(data.codeHash, normalized, otp);
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
                });

            return {
                user: {
                    userId: user.userId,
                    phone: user.phone,
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

    private getOtp6Code() {
        return String(randomInt(0, 1_000_000)).padStart(6, "0");
    }

    private hashHmacOtp(
        phone: string,
        code6: string,
        key: Buffer = this.OTP_SECRET
    ) {
        const msg = `${phone}:${code6}`;
        return createHmac("sha256", key).update(msg).digest("hex");
    }

    private verifyHmacOtp(
        codeHash: string,
        phone: string,
        code6: string,
        key: Buffer = this.OTP_SECRET
    ) {
        const calcHex = this.hashHmacOtp(phone, code6, key);
        const a = Buffer.from(codeHash, "hex");
        const b = Buffer.from(calcHex, "hex");
        return a.length === b.length && timingSafeEqual(a, b);
    }

    private expiresAtFromNow() {
        const ttlMs = this.OTP_TTL_IN_MINS * 60 * 1000;
        return new Date(Date.now() + ttlMs);
    }
}
