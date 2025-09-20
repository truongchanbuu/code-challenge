import { Request, Response, NextFunction } from "express";
import { AppError } from "../config/error";

export function notFoundHandler(
    _req: Request,
    _res: Response,
    next: NextFunction
) {
    next(AppError.notFound("Route not found"));
}

export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const status = err?.statusCode ?? 500;

    const payload: any = {
        ok: false,
        error: {
            code: err?.code ?? "INTERNAL_ERROR",
            statusCode: status,
            message: err?.message ?? "Something went wrong.",
            details: err?.details,
        },
    };

    return res.status(status).json(payload);
}
