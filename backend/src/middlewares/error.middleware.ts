import { Request, Response, NextFunction } from "express";
import { AppError } from "../config/error";

export function errorHandler(
    err: AppError,
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
