import dotenv from "dotenv";
dotenv.config();

export const configs = {
    port: process.env.PORT || 3000,
    origins: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
    sms: {
        twilloSid: process.env.TWILLO_SID,
        twilloToken: process.env.TWILLO_TOKEN,
        otpTtlInSecs: process.env.OTP_TTL_IN_SECS,
        otpMaxAttempts: process.env.OTP_MAX_ATTEMPTS,
    },
};
