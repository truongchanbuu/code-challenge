import { Server } from "socket.io";
import type http from "http";
import { z } from "zod";
import {
    SendMessageSchema,
    type SendMessageDTO,
    type Message,
} from "../models/chat.model";
import { Role } from "../models/role";

export type VerifyTokenFn = (
    token?: string
) => Promise<{ userId: string; phoneNumber?: string; role?: Role } | null>;

export interface SocketInit {
    httpServer: http.Server;
    verifyToken?: VerifyTokenFn;
    corsOrigins?: string[];
    path?: string;
    chatRepo: ChatRepository;
}

type Room = { instructorPhone: string; studentPhone: string };
type Ack = { ok: boolean; message?: Message };

export interface ChatRepository {
    createMessage(input: SendMessageDTO): Promise<Message>;
    ensureConversation?(input: {
        instructorPhone: string;
        studentPhone: string;
    }): Promise<void>;
    touchConversation?(input: {
        instructorPhone: string;
        studentPhone: string;
        lastMessage: { content: string; senderPhone: string; createdAt: Date };
    }): Promise<void>;
}

export class ISocketServer {
    emitLessonAssigned(..._args: any[]): any {}
    emitToPhone(..._args: any[]): any {}
    emitToUser(..._args: any[]): any {}
    emitToRoom(..._args: any[]): any {}
}

function roomKey(room: Room) {
    return `chat:${room.instructorPhone}:${room.studentPhone}`;
}

export class SocketServer {
    public io: Server;
    private chatRepo: ChatRepository;

    constructor({ httpServer, verifyToken, chatRepo }: SocketInit) {
        this.chatRepo = chatRepo;
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
            } catch {
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

            socket.on(
                "room:join",
                async (payload: Room, ack?: (a: Ack) => void) => {
                    try {
                        const room = z
                            .object({
                                instructorPhone: z.string().min(8),
                                studentPhone: z.string().min(8),
                            })
                            .parse(payload);
                        await this.chatRepo.ensureConversation?.(room);
                        socket.join(roomKey(room));
                        ack?.({ ok: true });
                    } catch {
                        ack?.({ ok: false });
                    }
                }
            );

            socket.on("room:leave", (payload: Room, ack?: (a: Ack) => void) => {
                try {
                    const room = z
                        .object({
                            instructorPhone: z.string().min(8),
                            studentPhone: z.string().min(8),
                        })
                        .parse(payload);
                    socket.leave(roomKey(room));
                    ack?.({ ok: true });
                } catch {
                    ack?.({ ok: false });
                }
            });

            socket.on(
                "chat:send",
                async (
                    payload: SendMessageDTO & { clientId?: string },
                    ack?: (a: Ack) => void
                ) => {
                    try {
                        const dto = SendMessageSchema.parse(payload);
                        if (dto.senderPhone !== socket.data.phoneNumber) {
                            ack?.({ ok: false });
                            return;
                        }
                        await this.chatRepo.ensureConversation?.({
                            instructorPhone: dto.instructorPhone,
                            studentPhone: dto.studentPhone,
                        });
                        const saved = await this.chatRepo.createMessage(dto);
                        await this.chatRepo.touchConversation?.({
                            instructorPhone: dto.instructorPhone,
                            studentPhone: dto.studentPhone,
                            lastMessage: {
                                content: saved.content,
                                senderPhone: saved.senderPhone,
                                createdAt: saved.createdAt,
                            },
                        });
                        const room = {
                            instructorPhone: dto.instructorPhone,
                            studentPhone: dto.studentPhone,
                        };
                        this.io.to(roomKey(room)).emit("chat:message", {
                            room,
                            message: saved,
                            clientId: payload.clientId ?? null,
                        });
                        ack?.({ ok: true, message: saved });
                    } catch {
                        ack?.({ ok: false });
                    }
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
