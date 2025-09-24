import { normalizePhone } from "../utils/phone";
import type { SocketServer } from "../libs/socket";
import type { UserRepo } from "../repos/user.repo";
import { NotificationRepo } from "../repos/notification.repo";
import {
    NotificationBase,
    NotificationItem,
} from "../models/notification.model";
import { EmailNotifier } from "./email.service";
import { APP_NAME } from "../config/constants";

export class NotificationService {
    constructor(
        private readonly deps: {
            notificationRepo: NotificationRepo;
            socketServer?: SocketServer;
            emailService: EmailNotifier;
            userRepo?: UserRepo;
        }
    ) {}

    async createAndDispatch(
        rawPhones: string[],
        base: NotificationBase,
        opts?: {
            sendEmail?: boolean;
            emailSubject?: string;
            emailHtml?: string;
            emailText?: string;
        }
    ): Promise<{ createdIds: string[] }> {
        const phones = Array.from(
            new Set(
                rawPhones
                    .map((p) => normalizePhone(p))
                    .filter((p): p is string => !!p)
            )
        );
        if (phones.length === 0) return { createdIds: [] };

        const ids = await this.deps.notificationRepo.createManyForPhones(
            phones,
            {
                type: base.type,
                title: base.title,
                body: base.body ?? "",
                data: base.data ?? {},
            }
        );

        try {
            const now = Date.now();
            for (let i = 0; i < phones.length; i++) {
                const toPhone = phones[i];
                const id = ids[i] ?? undefined;
                this.deps.socketServer?.emitToPhone(toPhone, "notify:new", {
                    id,
                    toPhone,
                    type: base.type,
                    title: base.title,
                    body: base.body ?? "",
                    data: base.data ?? {},
                    read: false,
                    createdAt: now,
                });
            }
        } catch (e: any) {
            console.error(e);
        }

        if (opts?.sendEmail && this.deps.emailService && this.deps.userRepo) {
            try {
                const pairs = await Promise.allSettled(
                    phones.map(async (p) => {
                        const u = await this.deps
                            .userRepo!.getUserByPhone(p)
                            .catch(() => null);
                        return u?.email as string | undefined;
                    })
                );
                const emails = pairs
                    .map((r) =>
                        r.status === "fulfilled" ? r.value : undefined
                    )
                    .filter((e): e is string => !!e);

                await Promise.allSettled(
                    emails.map((to) =>
                        this.deps.emailService.sendNotification({
                            to,
                            subject:
                                opts.emailSubject ??
                                `[${APP_NAME}] ${base.title}`,
                            text: opts.emailText ?? base.body ?? base.title,
                            html: opts.emailHtml ?? undefined,
                            title: base.title,
                            body: base.body ?? undefined,
                        })
                    )
                );
            } catch (e: any) {
                console.error(`Failed to send email notification.`);
            }
        }

        return { createdIds: ids };
    }

    async notifyLessonAssigned(
        phones: string[],
        lessonId: string,
        title: string,
        description?: string,
        opts?: { sendEmail?: boolean }
    ) {
        const base: NotificationBase = {
            type: "lesson_assigned",
            title: `New lesson: ${title}`,
            body: description ?? "",
            data: { lessonId, title },
        };

        const res = await this.createAndDispatch(phones, base, {
            sendEmail: !!opts?.sendEmail,
            emailSubject: `[${APP_NAME}] New lesson assigned: ${title}`,
            emailText: `You have a new lesson "${title}".`,
            emailHtml: `<p>You have a new lesson: <b>${title}</b>.</p>`,
        });

        try {
            this.deps.socketServer?.emitLessonAssigned(lessonId, title, phones);
        } catch {}

        return res;
    }

    listForPhone(phone: string, limit = 20) {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return Promise.resolve<NotificationItem[]>([]);
        return this.deps.notificationRepo.listForPhone(normalizedPhone, limit);
    }

    unreadCount(phone: string) {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return Promise.resolve(0);
        return this.deps.notificationRepo.unreadCount(normalizedPhone);
    }

    markRead(phone: string, id: string) {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return Promise.resolve();
        return this.deps.notificationRepo.markRead(normalizedPhone, id);
    }
}
