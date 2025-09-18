import { Twilio } from "twilio";
import { OtpNotifier } from "../repos/notifier";

export class SmsNotifier implements OtpNotifier {
    constructor(private twilio: Twilio) {}

    async sendLoginCode(
        to: string,
        otp: string,
        ttlMinutes: number
    ): Promise<void> {
        const body = `[Online Classroom Management Sysmtem] Your login code is ${otp}. Expires in ${ttlMinutes} mins.`;
        await this.twilio.messages.create({
            to,
            body,
            attempt: 1,
        });
    }
}
