import { Role } from "../models/role";

export interface JwtUser {
    userId: string;
    phone: string;
    role: Role;
    username?: string;
}

export interface ServerToClientEvents {
    "sys:pong": { at: number };
    "lesson:assigned": { lessonId: string; title: string; students: string[] }; // students: phone[]
    "chat:message": { roomId: string; from: string; text: string; at: number };
}

export interface ClientToServerEvents {
    "sys:ping": () => void;
    "room:join": (roomId: string, cb?: (ok: boolean) => void) => void;
    "lesson:subscribe": (lessonId: string) => void;
    "chat:send": (roomId: string, text: string) => void;
}

export interface InterServerEvents {
    "node:broadcast": (payload: { type: string; data: any }) => void;
}

export interface SocketData {
    user?: JwtUser;
}
