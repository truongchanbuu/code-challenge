import { Server } from "socket.io";
import type http from "http";

export type VerifyTokenFn = (
    token?: string
) => Promise<{ phone: string; role?: string } | null>;

export interface SocketInit {
    httpServer: http.Server;
    verifyToken?: VerifyTokenFn;
    corsOrigins?: string[];
    path?: string;
}

export class SocketServer {
    public io: Server;
    constructor({ httpServer, verifyToken }: SocketInit) {
        this.io = new Server(httpServer, {
            path: "/socket.io",
            cors: { origin: ["*"], credentials: true },
            transports: ["websocket", "polling"],
        });

        this.io.use(async (socket, next) => {
            try {
                let phone =
                    (socket.handshake.auth as any)?.phoneNumber ||
                    (socket.handshake.query as any)?.phoneNumber;
                const authHeader = socket.handshake.headers.authorization as
                    | string
                    | undefined;
                const token = authHeader?.replace(/^Bearer\s+/i, "");
                if (!phone && verifyToken && token) {
                    const u = await verifyToken(token);
                    phone = u?.phone;
                    if (u?.role) socket.data.role = u.role;
                }
                if (!phone || typeof phone !== "string")
                    return next(new Error("UNAUTHORIZED"));
                socket.data.phoneNumber = phone;
                next();
            } catch {
                next(new Error("UNAUTHORIZED"));
            }
        });

        this.io.on("connection", (socket) => {
            const phone: string = socket.data.phoneNumber;
            socket.join(`phone:${phone}`);

            this.io.emit("presence", { phoneNumber: phone, online: true });
            socket.on(
                "presence:list",
                (cb?: (res: { online: string[] }) => void) => {
                    const online = new Set<string>();
                    for (const [, s] of this.io.sockets.sockets) {
                        const p = (s as any).data?.phoneNumber;
                        if (p) online.add(p);
                    }
                    cb?.({ online: Array.from(online) });
                }
            );

            socket.on(
                "room:join",
                (roomId: string, cb?: (ok: boolean) => void) => {
                    if (!roomId) return cb?.(false);
                    socket.join(roomId);
                    cb?.(true);
                }
            );

            socket.on(
                "chat:send",
                (roomId: string, text: string, cb?: (res: any) => void) => {
                    const msg = (text ?? "").trim();
                    if (!roomId || !msg)
                        return cb?.({ ok: false, error: "BAD_INPUT" });
                    const payload = {
                        roomId,
                        from: phone,
                        text: msg,
                        at: Date.now(),
                    };
                    this.io.to(roomId).emit("chat:message", payload);
                    cb?.({ ok: true, data: payload });
                }
            );

            socket.on("lesson:subscribe", (lessonId: string) => {
                if (lessonId) socket.join(`lesson:${lessonId}`);
            });

            socket.on("disconnect", (reason) => {
                const room = this.io.sockets.adapter.rooms.get(
                    `phone:${phone}`
                );
                const remaining = room?.size ?? 0;
                if (remaining === 0) {
                    this.io.emit("presence", {
                        phoneNumber: phone,
                        online: false,
                    });
                }
            });
        });
    }

    emitToPhone(phone: string, event: string, payload: any) {
        this.io.to(`phone:${phone}`).emit(event, payload);
    }

    emitToRoom(roomId: string, event: string, payload: any) {
        this.io.to(roomId).emit(event, payload);
    }

    emitLessonAssigned(
        lessonId: string,
        title: string,
        studentPhones: string[]
    ) {
        const payload = {
            lessonId,
            title,
            students: studentPhones,
            at: Date.now(),
        };
        studentPhones.forEach((p) =>
            this.emitToPhone(p, "lesson:assigned", payload)
        );
        this.emitToRoom(`lesson:${lessonId}`, "lesson:assigned", payload);
    }
}
