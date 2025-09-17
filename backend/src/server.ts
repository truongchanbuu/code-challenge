import { createApp } from "./app";
import { createConfigContainer } from "./container";

let server;

async function bootstrap() {
    try {
        const container = createConfigContainer();
        const config = container.resolve("config");

        const app = createApp();

        const PORT = config.port || 3000;
        server = app.listen(PORT, () =>
            console.log(`Server is running on http://localhost:${PORT}`)
        );
    } catch (e) {
        console.error("Failed to start server", e);
    }
}

bootstrap();
