import { asFunction, asValue } from "awilix";
import { createApp } from "./app";
import { createConfigContainer } from "./container";
import { SocketServer } from "./libs/socket";
import { Server } from "http";

let server: Server;

async function bootstrap() {
    try {
        const container = createConfigContainer();
        const config = container.resolve("config");

        container.register({ httpServer: asValue(server) });
        container.register({
            socketServer: asFunction(
                ({ httpServer, jwtService }) =>
                    new SocketServer({
                        httpServer,
                        verifyToken: async (t?: string) =>
                            t ? await jwtService.verifyAccess(t) : null,
                    })
            ).singleton(),
        });

        const app = createApp({ config, container });

        const PORT = config.port || 3000;
        server = app.listen(PORT, () =>
            console.log(`Server is running on http://localhost:${PORT}...`)
        );
    } catch (e) {
        console.error("Failed to start server.", e);
    }
}

bootstrap();
