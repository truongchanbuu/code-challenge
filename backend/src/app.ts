import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";
import { AppError } from "./config/error";

export function createApp({ config }: { config: any }) {
    const app = express();
    const origins = config.origins;

    app.use(
        cors({
            origin: origins,
        })
    );
    app.use(express.json());

    app.use(AppError.notFound);
    app.use(errorHandler);

    return app;
}
