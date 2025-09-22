// src/controllers/notification.controller.ts
import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { getAuthUser } from "../middlewares/auth.middleware";
import { normalizePhone } from "../utils/phone";

export class NotificationController {
    private readonly notificationService: NotificationService;
    constructor(deps: { notificationService: NotificationService }) {
        this.notificationService = deps.notificationService;
    }

    async list(req: Request, res: Response) {
        const user = getAuthUser(req, res);
        const phone = normalizePhone(user.phoneNumber);
        const items = await this.notificationService.listForPhone(
            phone!,
            Number(req.query.limit ?? 20)
        );
        res.json({ ok: true, data: items });
    }

    async count(req: Request, res: Response) {
        const user = getAuthUser(req, res);
        const phone = normalizePhone(user.phoneNumber);
        const unread = await this.notificationService.unreadCount(phone!);
        res.json({ ok: true, data: { unread } });
    }

    async markRead(req: Request, res: Response) {
        const user = getAuthUser(req, res);
        const phone = normalizePhone(user.phoneNumber);
        await this.notificationService.markRead(phone!, req.params.id);
        res.json({ ok: true });
    }
}
