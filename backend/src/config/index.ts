import dotenv from "dotenv";
dotenv.config();

export const configs = {
    port: process.env.PORT || 3000,
    origins: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET,
    accessTokentlSec: process.env.JWT_ACCESS_TOKEN_TTL || 900,
    refreshTokentlSec: process.env.JWT_REFRESH_TOKEN_TTL || 2592000,
    sms: {
        from: process.env.TWILIO_FROM,
        messagingServiceSid: process.env.TWILIO_MSID,
        twilioSid: process.env.TWILIO_SID,
        twilioToken: process.env.TWILIO_TOKEN,
        otpSecret: process.env.OTP_SECRET,
        otpTtlInMins: Number(process.env.OTP_TTL_IN_MINS || 5),
        otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
        resend_cooldown: Number(process.env.RESEND_COOLDOWN || 30),
    },
    email: {
        from: process.env.EMAIL_FROM,
        gmailUser: process.env.GMAIL_USER,
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    },
};
