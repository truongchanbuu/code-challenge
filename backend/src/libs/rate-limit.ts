import rateLimit from "express-rate-limit";

export const createOtpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => `otp:create:${(req.body?.phoneNumber ?? "").trim()}`,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Too many requests for this phone." },
});

export const verifyOtpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 60,
    keyGenerator: (req) => `otp:verify:${(req.body?.phoneNumber ?? "").trim()}`,
    standardHeaders: true,
    legacyHeaders: false,
});
