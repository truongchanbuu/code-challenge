import { Server } from "socket.io";
import type http from "http";

export type VerifyTokenFn = (
    token?: string
) => Promise<{ userId: string; phoneNumber?: string; role?: string } | null>;

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
            cors: { origin: ["*"], credentials: false },
            transports: ["websocket", "polling"],
        });

        this.io.use(async (socket, next) => {
            try {
                const tokenFromAuth = (socket.handshake.auth as any)?.token as
                    | string
                    | undefined;
                const tokenFromHeader = (
                    socket.handshake.headers.authorization as string | undefined
                )?.replace(/^Bearer\s+/i, "");
                const token = tokenFromAuth || tokenFromHeader;

                let userId: string | undefined;
                let phone: string | undefined;

                if (verifyToken && token) {
                    const u = await verifyToken(token);
                    userId = u?.userId;
                    phone = u?.phoneNumber;
                    if (u?.role) socket.data.role = u.role;
                }

                if (!userId) return next(new Error("UNAUTHORIZED"));

                socket.data.userId = userId;
                if (phone) socket.data.phoneNumber = phone;
                next();
            } catch (e) {
                console.error("[SOCKET] middleware error", e);
                next(new Error("UNAUTHORIZED"));
            }
        });

        this.io.on("connection", (socket) => {
            const userId: string = socket.data.userId;
            const phone: string | undefined = socket.data.phoneNumber;

            const userRoom = `user:${userId}`;
            const before =
                this.io.sockets.adapter.rooms.get(userRoom)?.size ?? 0;
            socket.join(userRoom);
            if (phone) socket.join(`phone:${phone}`);
            const after =
                this.io.sockets.adapter.rooms.get(userRoom)?.size ?? 0;

            if (before === 0) {
                this.io.emit("presence", {
                    userId,
                    phoneNumber: phone ?? null,
                    online: true,
                });
            }

            socket.on(
                "presence:list",
                (cb?: (res: { onlineUserIds: string[] }) => void) => {
                    const set = new Set<string>();
                    for (const [, s] of this.io.sockets.sockets) {
                        const uid = (s as any).data?.userId;
                        if (uid) set.add(uid);
                    }
                    cb?.({ onlineUserIds: Array.from(set) });
                }
            );

            socket.on("disconnect", () => {
                const remaining =
                    this.io.sockets.adapter.rooms.get(userRoom)?.size ?? 0;
                if (remaining === 0) {
                    this.io.emit("presence", {
                        userId,
                        phoneNumber: phone ?? null,
                        online: false,
                    });
                }
            });
        });
    }

    emitToUser(userId: string, event: string, payload: any) {
        this.io.to(`user:${userId}`).emit(event, payload);
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
