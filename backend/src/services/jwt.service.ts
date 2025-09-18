import jwt, { JwtPayload } from "jsonwebtoken";

export class JwtService {
    private secret: string;
    private accessTtl: number;
    private refreshTtl: number;

    constructor(config: any) {
        if (!config?.secret) throw new Error("JWT secret is required.");
        this.secret = config.secret;
        this.accessTtl = config.accessTtlSec ?? 15 * 60;
        this.refreshTtl = config.refreshTtlSec ?? 30 * 24 * 60 * 60;
    }

    signAccess(subject: string, claims: any = {}) {
        return jwt.sign(claims, this.secret, {
            algorithm: "HS256",
            subject: subject,
            expiresIn: this.accessTtl,
        });
    }

    signRefresh(subject: string, tokenVersion = 0) {
        return jwt.sign({ tv: tokenVersion }, this.secret, {
            algorithm: "HS256",
            subject: subject,
            expiresIn: this.refreshTtl,
        });
    }

    verifyAccess(token: string) {
        return jwt.verify(token, this.secret, {
            algorithms: ["HS256"],
        });
    }

    verifyRefresh(token: string) {
        return jwt.verify(token, this.secret, {
            algorithms: ["HS256"],
        });
    }

    issueTokenPair(user: {
        userId: string;
        role?: string;
        phone?: string;
        tokenVersion?: number;
    }) {
        const accessToken = this.signAccess(user.userId, {
            role: user.role,
            phone: user.phone,
        });
        const refreshToken = this.signRefresh(
            user.userId,
            user.tokenVersion ?? 0
        );
        return { accessToken, refreshToken };
    }
}
