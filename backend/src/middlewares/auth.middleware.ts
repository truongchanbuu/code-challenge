import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError, ERROR_CODE } from "../config/error";
import { Role } from "../models/role";

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const container: any = (req as any).container;
    const jwtService =
        container?.cradle?.jwtService ?? container?.resolve?.("jwtService");
    if (!jwtService) {
        return next(
            new AppError("Server misconfigured", 500, ERROR_CODE.INTERNAL_ERROR)
        );
    }

    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";

    if (!token)
        return next(new AppError("Unauthorized", 401, ERROR_CODE.UNAUTHORIZED));
    try {
        const payload = jwtService.verifyAccess(token) as any;

        if (!payload?.sub || !payload?.role) {
            return next(
                new AppError("Unauthorized", 401, ERROR_CODE.UNAUTHORIZED)
            );
        }

        (res.locals as any).auth = payload;
        next();
    } catch {
        next(new AppError("Unauthorized", 401, ERROR_CODE.UNAUTHORIZED));
    }
};

export const requireRoles = (...roles: Role[]) => {
    const allow = new Set(roles);
    return (req: Request, res: Response, next: NextFunction) => {
        const auth = (res.locals as any).auth;
        if (!auth) {
            return next(
                new AppError("Unauthorized", 401, ERROR_CODE.UNAUTHORIZED)
            );
        }
        if (!allow.has(auth.role)) {
            return next(new AppError("Forbidden", 403, ERROR_CODE.FORBIDDEN));
        }
        next();
    };
};

export function getAuthUser(req: Request, res: Response) {
    return (res.locals as any).auth;
}
