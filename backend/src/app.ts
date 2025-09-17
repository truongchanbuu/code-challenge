import express from "express";
import cors from "cors";
import { errorHandler, notFound } from "./middlewares/error.middleware";

export function createApp({ config }: { config: any }) {
    const app = express();
    const origins = config.origins;

    app.use(
        cors({
            origin: origins,
        })
    );
    app.use(express.json());

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
