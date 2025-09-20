import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { scopePerRequest } from "awilix-express";

export function createApp({
    config,
    container,
}: {
    config: any;
    container: any;
}) {
    const app = express();
    const origins = config.origins;

    app.use(
        cors({
            origin: origins,
        })
    );

    app.use((req, _res, next) => {
        console.log(
            "[BE] %s %s host=%s x-forwarded-host=%s",
            req.method,
            req.url,
            req.headers.host,
            req.headers["x-forwarded-host"]
        );
        next();
    });

    app.use(express.json());

    app.use(scopePerRequest(container));

    const adminRoutes = container.resolve("adminRoutes");
    const authRoutes = container.resolve("authRoutes");

    app.use("/admin", adminRoutes.router);
    app.use("/api", authRoutes.router);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
