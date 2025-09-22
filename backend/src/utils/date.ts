export const toDate = (v: any): Date | null =>
    v == null
        ? null
        : v instanceof Date
          ? v
          : typeof v?.toDate === "function"
            ? v.toDate()
            : null;

export function toISO(v: any): string | null {
    if (!v) return null;
    if (v.toDate) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    return new Date(v).toISOString();
}

export function expiresAtFromNow(ttlInMins: number = 5) {
    const ttlMs = ttlInMins * 60 * 1000;
    return new Date(Date.now() + ttlMs);
}
