import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(
    phoneNumber?: string,
    locale: CountryCode = "VN"
): string | undefined {
    if (!phoneNumber) return undefined;
    const cleaned = phoneNumber.trim().replace(/[()\.\-\s]/g, "");
    if (cleaned === "") return undefined;
    const parsed = parsePhoneNumberFromString(phoneNumber, locale);
    return parsed?.isValid() ? parsed.format("E.164") : undefined;
}
