import jwt from "jsonwebtoken";

export class JwtService {
    private secret: string;
    private accessTtl: number;
    private refreshTtl: number;

    constructor({ config }: { config: any }) {
        if (!config?.jwtSecret) throw new Error("JWT secret is required.");
        this.secret = config.jwtSecret;
        this.accessTtl = config.accessTtlSec ?? 15 * 60;
        this.refreshTtl = config.refreshTtlSec ?? 30 * 24 * 60 * 60;
    }

    signAccess(sub: string, claims: any = {}) {
        return jwt.sign(claims, this.secret, {
            algorithm: "HS256",
            subject: sub,
            expiresIn: this.accessTtl,
        });
    }

    signRefresh(sub: string, tokenVersion = 0) {
        return jwt.sign({ tv: tokenVersion }, this.secret, {
            algorithm: "HS256",
            subject: sub,
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
        phoneNumber?: string;
        email?: string;
        tokenVersion?: number;
    }) {
        const accessToken = this.signAccess(user.userId, {
            role: user.role,
            phoneNumber: user.phoneNumber,
            email: user.email,
        });
        const refreshToken = this.signRefresh(
            user.userId,
            user.tokenVersion ?? 0
        );
        return { accessToken, refreshToken };
    }
}
