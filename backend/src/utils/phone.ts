import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(
    phone?: string,
    locale: CountryCode = "VN"
): string | undefined {
    if (!phone) return undefined;
    const cleaned = phone.trim().replace(/[()\.\-\s]/g, "");
    if (cleaned === "") return undefined;
    const parsed = parsePhoneNumberFromString(phone, locale);
    return parsed?.isValid() ? parsed.format("E.164") : undefined;
}
