import type { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { Role } from "../models/role";

export class ChatController {
    private readonly chatService: ChatService;
    constructor(deps: { chatService: ChatService }) {
        this.chatService = deps.chatService;
    }

    async sendMessage(req: Request, res: Response) {
        try {
            const data = await this.chatService.sendMessage(req.body);
            res.status(201).json({ success: true, data });
        } catch (e: any) {
            res.status(400).json({
                success: false,
                error: e?.message ?? "Bad Request",
            });
        }
    }

    async getHistory(req: Request, res: Response) {
        try {
            const { instructorPhone, studentPhone, limit, cursor } =
                req.query as Record<string, string | undefined>;
            const data = await this.chatService.getHistory({
                instructorPhone: instructorPhone ?? "",
                studentPhone: studentPhone ?? "",
                limit: limit ? Number(limit) : 20,
                cursor: cursor ?? null,
            });
            res.status(200).json({ success: true, ...data });
        } catch (e: any) {
            res.status(400).json({
                success: false,
                error: e?.message ?? "Bad Request",
            });
        }
    }

    async listConversations(req: Request, res: Response) {
        try {
            const { userPhone, role, limit, cursor } = req.query as Record<
                string,
                string | undefined
            >;
            const data = await this.chatService.listConversations({
                userPhone: userPhone ?? "",
                role: (role ?? "student") as Role,
                limit: limit ? Number(limit) : 20,
                cursor: cursor ?? null,
            });
            res.status(200).json({ success: true, ...data });
        } catch (e: any) {
            res.status(400).json({
                success: false,
                error: e?.message ?? "Bad Request",
            });
        }
    }
}
