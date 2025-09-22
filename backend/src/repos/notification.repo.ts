import type { CollectionReference, Firestore } from "firebase-admin/firestore";
import { NotificationItem } from "../models/notification.model";

export class NotificationRepo {
    private readonly firestore: Firestore;
    private readonly notificationCollection: CollectionReference;

    constructor(deps: { firestore: Firestore }) {
        this.firestore = deps.firestore;
        this.notificationCollection = this.firestore.collection("notification");
    }

    async createManyForPhones(
        phones: string[],
        base: Omit<NotificationItem, "id" | "toPhone" | "read" | "createdAt">
    ): Promise<string[]> {
        const now = new Date();
        const ids: any[] = [];
        for (const phone of phones) {
            const notificationItemRef = this.notificationCollection
                .doc(phone)
                .collection("items")
                .doc();

            await notificationItemRef.set({
                toPhone: phone,
                type: base.type,
                title: base.title,
                body: base.body ?? "",
                data: base.data ?? {},
                read: false,
                createdAt: now,
            });

            ids.push(notificationItemRef.id);
        }
        return ids;
    }

    async listForPhone(phone: string, limit = 20): Promise<NotificationItem[]> {
        const snap = await this.notificationCollection
            .doc(phone)
            .collection("items")
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();
        return snap.docs.map((doc: any) => {
            const data = doc.data() as any;
            return {
                ...data,
                createdAt: data.createdAt?.toDate?.() ?? new Date(),
            };
        });
    }

    async unreadCount(phone: string): Promise<number> {
        const quantity = await this.notificationCollection
            .doc(phone)
            .collection("items")
            .where("read", "==", false)
            .get();
        return quantity.size;
    }

    async markRead(phone: string, id: string): Promise<void> {
        await this.notificationCollection
            .doc(phone)
            .collection("items")
            .doc(id)
            .update({ read: true });
    }
}
