import { Twilio } from "twilio";
import { OtpNotifier } from "../repos/notifier";
import { AppError, ERROR_CODE } from "../config/error";
import { normalizePhone } from "../utils/phone";

export class SmsNotifier implements OtpNotifier {
    private readonly twilio: Twilio;
    private readonly from: string;
    private readonly messagingServiceSid: string;

    constructor({ twilio, config }: { twilio: any; config: any }) {
        this.twilio = twilio;
        this.from = config?.sms?.from ?? "";
        this.messagingServiceSid = config?.sms?.messagingServiceSid;
    }

    async sendLoginCode(
        to: string,
        otp: string,
        ttlMinutes: number
    ): Promise<void> {
        try {
            if (!this.messagingServiceSid && !this.from) {
                throw new AppError(
                    "Twilio sender not configured",
                    500,
                    ERROR_CODE.INTERNAL_ERROR
                );
            }

            const body = `[Online Classroom Management System] Your login code is ${otp}. Expires in ${ttlMinutes} mins.`;
            const toPhone = normalizePhone(to);
            if (!toPhone)
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const params = this.messagingServiceSid
                ? {
                      messagingServiceSid: this.messagingServiceSid,
                      to,
                      body,
                      validityPeriod: Math.min(36000, ttlMinutes * 60),
                  }
                : {
                      from: this.from,
                      to,
                      body,
                      validityPeriod: Math.min(36000, ttlMinutes * 60),
                  };

            try {
                const msg = await this.twilio.messages.create(params);
                await this.twilio.messages(msg.sid).fetch();
            } catch (e: any) {
                console.error({
                    code: e?.code,
                    status: e?.status,
                    message: e?.message,
                    moreInfo: e?.moreInfo,
                });
            }
        } catch (e) {
            console.error(`SMS delivery failed: ${e}`);
            throw new AppError(
                "SMS delivery failed",
                502,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async waitFinalStatus(messageSid: string, timeoutMs = 60_000) {
        const terminal = new Set([
            "delivered",
            "undelivered",
            "failed",
            "canceled",
        ]);
        const t0 = Date.now();
        let last;
        while (Date.now() - t0 < timeoutMs) {
            const m = await this.twilio.messages(messageSid).fetch();
            console.log(
                "status:",
                m.status,
                "err:",
                m.errorCode,
                m.errorMessage
            );
            last = m;
            if (terminal.has(m.status)) return m;
            await new Promise((r) => setTimeout(r, 3000));
        }
        return last;
    }
}
