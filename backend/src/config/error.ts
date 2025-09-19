export enum ERROR_CODE {
    INTERNAL_ERROR = "INTERNAL_ERROR",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    VALIDATION = "VALIDATION",

    OTP_NOT_FOUND = "OTP_NOT_FOUND",
    OTP_EXPIRED = "OTP_EXPIRED",
    OTP_MISMATCH = "OTP_MISMATCH",
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",
    OTP_BLOCKED = "OTP_BLOCKED",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    RATE_LIMITED = "RATE_LIMITED",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
}

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode = 500,
        public code: ERROR_CODE = ERROR_CODE.INTERNAL_ERROR,
        public details?: any
    ) {
        super(message);
    }

    static notFound(msg = "Not found") {
        return new AppError(msg, 404, ERROR_CODE.NOT_FOUND);
    }

    static validation(msg = "Invalid data.", details: any) {
        return new AppError(msg, 400, ERROR_CODE.VALIDATION, details);
    }
}
