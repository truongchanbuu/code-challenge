import { Request, Response, NextFunction } from "express";
import { AppError, ERROR_CODE } from "../config/error";
import { ZodError } from "zod";

function checkSchema(schemas: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) req.body = schemas.body.parse(req.body);
            if (schemas.query) req.query = schemas.query.parse(req.query);
            if (schemas.params) req.params = schemas.params.parse(req.params);
            next();
        } catch (e) {
            console.error(e);
            if (e instanceof ZodError) {
                const errorMessages = e.issues.map((issue: any) => ({
                    message: `${issue.path.join(".")} is ${issue.message}`,
                }));

                return next(
                    new AppError(
                        "Invalid data.",
                        400,
                        ERROR_CODE.VALIDATION,
                        errorMessages
                    )
                );
            }
            return next(e);
        }
    };
}

export const validate = {
    body: (schema: any) => checkSchema({ body: schema }),
    query: (schema: any) => checkSchema({ query: schema }),
    params: (schema: any) => checkSchema({ params: schema }),
    headers: (schema: any) => checkSchema({ headers: schema }),
    all: (schemas: any) => checkSchema(schemas),
};
