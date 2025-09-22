import { AppError, ERROR_CODE } from "../config/error";
import { AccessCode } from "../models/access-code.model";
import { UpdateProfileDTO } from "../models/user.dto";
import { AccessCodeRepo } from "../repos/access-code.repo";
import { Notifier } from "../repos/notifier";
import { UserRepo } from "../repos/user.repo";
import { getOtp6Code, hashHmacOtp } from "../utils/access-code";
import { expiresAtFromNow } from "../utils/date";
import { normalizePhone } from "../utils/phone";
import { EmailNotifier } from "./email.service";
import { SmsNotifier } from "./sms.service";

export class ProfileService {
    private readonly userRepo: UserRepo;
    private readonly accessCodeRepo: AccessCodeRepo;
    private readonly emailService: Notifier;
    private readonly smsService: Notifier;

    private readonly OTP_TTL_IN_MINS: number;
    private readonly OTP_MAX_ATTEMPTS: number;
    private readonly OTP_SECRET: Buffer;

    constructor(deps: {
        userRepo: UserRepo;
        emailService: EmailNotifier;
        smsService: SmsNotifier;
        accessCodeRepo: AccessCodeRepo;
        config: any;
    }) {
        this.userRepo = deps.userRepo;
        this.accessCodeRepo = deps.accessCodeRepo;
        this.emailService = deps.emailService;
        this.smsService = deps.smsService;
        this.OTP_TTL_IN_MINS = deps.config?.sms?.otpTtlInMins ?? 5;
        this.OTP_MAX_ATTEMPTS = deps.config?.sms?.otpMaxAttempts ?? 5;

        if (
            !deps.config?.sms?.otpSecret ||
            deps.config?.sms?.otpSecret?.trim() === ""
        ) {
            throw new AppError(
                "No otp secret found.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }

        this.OTP_MAX_ATTEMPTS = deps.config?.sms?.otpMaxAttempts ?? 5;
        this.OTP_SECRET = Buffer.from(deps.config?.sms?.otpSecret, "hex");
    }

    async getMyProfile(userId: string) {
        try {
            const user = await this.userRepo.getUserById(userId);
            if (!user)
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.USER_NOT_FOUND
                );

            return user;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get profile.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async updateProfile(userId: string, data: UpdateProfileDTO) {
        try {
            const user = await this.userRepo.getUserById(userId);
            if (!user)
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.USER_NOT_FOUND
                );
            const { email, phoneNumber, username } = data;

            if (username) {
                await this.userRepo.updateUser(userId, { ...user, username });
                return await this.userRepo.getUserById(userId);
            }

            if (email || phoneNumber) {
                const otp = getOtp6Code();
                if (process.env.NODE_ENV !== "production") {
                    console.debug("[OTP]", otp);
                }
                const codeHash = hashHmacOtp(userId, otp, this.OTP_SECRET);

                const type = email ? "email" : "phone";
                const accessCode: AccessCode = {
                    userId,
                    type,
                    target: email ?? phoneNumber,
                    phoneNumber: type === "phone" ? phoneNumber : null,
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
                    if (email) {
                        await this.emailService.sendLoginCode(
                            email,
                            otp,
                            this.OTP_TTL_IN_MINS
                        );
                    } else {
                        const normalizedPhone = normalizePhone(phoneNumber)!;
                        await this.smsService.sendLoginCode(
                            normalizedPhone,
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

                return await this.userRepo.getUserById(userId);
            }
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to update profile.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
