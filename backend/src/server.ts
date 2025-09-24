import http, { Server } from "http";
import { asFunction, asValue } from "awilix";
import { createApp } from "./app";
import { createConfigContainer } from "./container";
import { SocketServer } from "./libs/socket";

async function bootstrap() {
    try {
        const container = createConfigContainer();
        const config = container.resolve("config");

        const app = createApp({ config, container });

        const httpServer: Server = http.createServer(app);

        container.register({ httpServer: asValue(httpServer) });
        container.register({
            socketServer: asFunction(
                ({ httpServer, jwtService }) =>
                    new SocketServer({
                        httpServer,
                        verifyToken: async (t?: string) => {
                            try {
                                if (!t) return null;
                                const p = await jwtService.verifyAccess(t);
                                return {
                                    userId: p?.sub,
                                    phoneNumber: p?.phoneNumber || null,
                                    role: p?.role || null,
                                };
                            } catch {
                                return null;
                            }
                        },
                        chatRepo: container.resolve("chatRepo"),
                    })
            ).singleton(),
        });

        container.resolve<SocketServer>("socketServer");

        const PORT = config.port || 3000;
        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}...`);
        });
    } catch (e) {
        console.error("Failed to start server.", e);
    }
}

bootstrap();
