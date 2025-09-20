import crypto from "crypto";

export function generateSetupToken(lengthBytes = 32): string {
    return crypto.randomBytes(lengthBytes).toString("base64url");
}

export function sha256Hex(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

export function hashSetupTokenRaw(rawToken: string, pepper: string) {
    return sha256Hex(`${pepper}:${rawToken}`);
}
