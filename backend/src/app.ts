import express from "express";
import cors from "cors";

export function createApp() {
    const app = express();
    app.use(cors());

    return app;
}
