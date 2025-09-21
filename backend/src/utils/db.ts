export function encodeCursor(cursor: {
    sortField: string;
    sortValue: any;
    documentId: string;
}) {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(encoded?: string | null) {
    if (!encoded) return null;
    try {
        return JSON.parse(
            Buffer.from(encoded, "base64url").toString("utf8")
        ) as {
            sortField: string;
            sortValue: any;
            documentId: string;
        };
    } catch {
        return null;
    }
}

export function pickSearchField(query: string): {
    field: "nameLower" | "emailLower" | "phoneNumber";
    prefix: string;
} {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return { field: "nameLower", prefix: "" };
    if (normalized.includes("@"))
        return { field: "emailLower", prefix: normalized };
    if (/^\+?\d+$/.test(normalized))
        return { field: "phoneNumber", prefix: normalized };
    return { field: "nameLower", prefix: normalized };
}
