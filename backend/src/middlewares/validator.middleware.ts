import { Request, Response, NextFunction } from "express";
import { AppError, ERROR_CODE } from "../config/error";
import { z, ZodError } from "zod";

function checkSchema(schemas: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) req.body = schemas.body.parse(req.body);
            if (schemas.query) {
                const parsed = schemas.query.parse(req.query);
                const cur = (req as any).validated || {};
                (req as any).validated = { ...cur, query: parsed };
            }
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
    params:
        (schema: any, key?: string) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                const finalSchema =
                    schema instanceof z.ZodString
                        ? z.object({
                              [key || Object.keys(req.params)[0] || "id"]:
                                  schema,
                          })
                        : schema;
                return checkSchema({ params: finalSchema })(req, res, next);
            } catch (e) {
                return next(e);
            }
        },
    headers: (schema: any) => checkSchema({ headers: schema }),
    all: (schemas: any) => checkSchema(schemas),
};
