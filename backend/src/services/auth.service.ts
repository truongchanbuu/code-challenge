export class AuthService {
    private OTP_TTL_IN_SECS: number;
    private OTP_MAX_ATTEMPTS: number;

    constructor({ config }: { config: any }) {
        this.OTP_TTL_IN_SECS = config?.sms?.OTP_TTL_IN_SECS ?? 5;
        this.OTP_MAX_ATTEMPTS = config?.sms?.OTP_MAX_ATTEMPTS ?? 5;
    }

    public createAccessCode(phoneNumber: string) {}

    private getOtpCode() {}
}
