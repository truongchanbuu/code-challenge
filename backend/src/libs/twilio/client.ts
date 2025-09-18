import twilio from "twilio";

export function createTwilioClient({ config }: { config: any }) {
    const smsConfig = config.sms;

    const twilioSid = smsConfig?.twilioSid;
    const twilioToken = smsConfig?.twilioToken;

    if (!twilioSid || !twilioToken) {
        throw new Error("Initialize Twilio client failed.");
    }

    return twilio(twilioSid, twilioToken);
}
