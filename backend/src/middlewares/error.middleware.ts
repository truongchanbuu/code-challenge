import { Request, Response, NextFunction } from "express";
import { AppError } from "../config/error";

export function notFound(req: Request, res: Response, next: NextFunction) {
    next(new AppError("Route not found.", 404, "NOT_FOUND"));
}

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    const status = err?.statusCode ?? 500;

    const payload: any = {
        ok: false,
        error: {
            code: err?.code ?? "INTERNAL_ERROR",
            statusCode: status,
            message: err?.message ?? "Something went wrong.",
        },
    };

    return res.status(status).json(payload);
}
