import { AppError, ERROR_CODE } from "../config/error";
import { AccessCodeType } from "../models/access-code.model";
import { normalizePhone } from "./phone";

export function normalizeTarget(type: AccessCodeType, raw: string): string {
    if (type === "phone") {
        const phoneNumber = normalizePhone(raw);
        if (!phoneNumber)
            throw new AppError("Invalid phone.", 400, ERROR_CODE.VALIDATION);
        return phoneNumber;
    }

    const email = (raw ?? "").trim().toLowerCase();
    if (!email || !email.includes("@"))
        throw new AppError("Invalid email.", 400, ERROR_CODE.VALIDATION);
    return email;
}

export function isExactOneTargetValue(input: {
    phoneNumber?: string;
    email?: string;
}) {
    const normalizedPhone = input.phoneNumber?.trim() ?? "";
    const normalizedEmail = input.email?.trim().toLowerCase() ?? "";
    const hasPhone = normalizedPhone.length > 0;
    const hasEmail = normalizedEmail.length > 0;
    return hasEmail !== hasPhone;
}

export function getAvailableTarget(input: {
    phoneNumber?: string;
    email?: string;
}): {
    type: AccessCodeType;
    target: string;
} {
    const normalizedPhone = input.phoneNumber?.trim() ?? "";
    const normalizedEmail = input.email?.trim().toLowerCase() ?? "";

    const hasPhone = normalizedPhone.length > 0;
    const hasEmail = normalizedEmail.length > 0;

    if (!hasPhone && !hasEmail) {
        throw new AppError(
            "Missing phone or email",
            400,
            ERROR_CODE.VALIDATION
        );
    }

    if (hasPhone && hasEmail) {
        throw new AppError(
            "Provide only one of phone or email",
            400,
            ERROR_CODE.VALIDATION
        );
    }

    return hasPhone
        ? { type: "phone", target: normalizedPhone }
        : { type: "email", target: normalizedEmail };
}
