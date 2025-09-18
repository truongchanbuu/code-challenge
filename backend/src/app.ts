import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

export function createApp({ config }: { config: any }) {
    const app = express();
    const origins = config.origins;

    app.use(
        cors({
            origin: origins,
        })
    );
    app.use(express.json());

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
