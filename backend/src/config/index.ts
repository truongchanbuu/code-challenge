import dotenv from "dotenv";
dotenv.config();

export const configs = {
    port: process.env.PORT || 3000,
    origins: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET,
    accessTokentlSec: process.env.JWT_ACCESS_TOKEN_TTL || 900,
    refreshTokentlSec: process.env.JWT_REFRESH_TOKEN_TTL || 2592000,
    sms: {
        twilioSid: process.env.TWILIO_SID,
        twilioToken: process.env.TWILIO_TOKEN,
        otpSecret: process.env.OTP_SECRET,
        otpTtlInSecs: process.env.OTP_TTL_IN_MINS,
        otpMaxAttempts: process.env.OTP_MAX_ATTEMPTS,
        resend_cooldown: process.env.RESEND_COOLDOWN || 30,
    },
};
