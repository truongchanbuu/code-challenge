import { Request, Response, NextFunction } from "express";

export enum ERROR_CODE {
    INTERNAL_ERROR = "INTERNAL_ERROR",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    VALIDATION = "VALIDATION",
}

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode = 500,
        public code: string = ERROR_CODE.INTERNAL_ERROR
    ) {
        super(message);
    }

    public static notFound(req: Request, res: Response, next: NextFunction) {
        next(new AppError("Route not found.", 404, ERROR_CODE.NOT_FOUND));
    }
}

export class DatabaseError extends Error {
    constructor(
        public message: string = "Something went wrong.",
        public code: string = ERROR_CODE.INTERNAL_ERROR
    ) {
        super(message);
    }
}
