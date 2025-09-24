import {
    ConversationConverter,
    MessageConverter,
    type Conversation,
    type Message,
} from "../models/chat.model";
import {
    CollectionReference,
    FieldValue,
    Firestore,
    WithFieldValue,
} from "firebase-admin/firestore";
import { Role } from "../models/role";

export class ChatRepo {
    private readonly firestore: Firestore;
    private readonly conversationCollection: CollectionReference<Conversation>;

    constructor(deps: { firestore: Firestore }) {
        this.firestore = deps.firestore;
        this.conversationCollection = this.firestore
            .collection("conversations")
            .withConverter(ConversationConverter);
    }

    private conversationId(instructorPhone: string, studentPhone: string) {
        return `conversation_${instructorPhone}_${studentPhone}`;
    }

    async getOrCreateConversation(
        instructorPhone: string,
        studentPhone: string
    ): Promise<Conversation> {
        const id = this.conversationId(instructorPhone, studentPhone);
        const conversationRef = this.conversationCollection.doc(id);
        const snapshot = await conversationRef.get();
        if (snapshot.exists) return snapshot.data()!;
        const data: WithFieldValue<Conversation> = {
            id,
            participants: {
                instructor: instructorPhone,
                student: studentPhone,
            },
            createdAt: FieldValue.serverTimestamp() as any,
            updatedAt: FieldValue.serverTimestamp() as any,
            lastMessage: null,
        };
        await conversationRef.set(data);
        const created = await conversationRef.get();
        return created.data()!;
    }

    async appendMessage(
        conversationId: string,
        msg: Omit<Message, "id" | "createdAt" | "conversationId">
    ): Promise<Message> {
        const msgsCol = this.conversationCollection
            .doc(conversationId)
            .collection("messages")
            .withConverter(MessageConverter);
        const msgRef = msgsCol.doc();
        const toSave: WithFieldValue<Message> = {
            id: msgRef.id,
            conversationId,
            senderPhone: msg.senderPhone,
            senderRole: msg.senderRole,
            content: msg.content,
            createdAt: FieldValue.serverTimestamp() as any,
            readBy: msg.readBy ?? [],
        };
        await msgRef.set(toSave);
        const convRef = this.conversationCollection.doc(conversationId);
        await convRef.update({
            updatedAt: FieldValue.serverTimestamp(),
            lastMessage: {
                content: msg.content,
                senderPhone: msg.senderPhone,
                createdAt: FieldValue.serverTimestamp(),
            },
        });
        const saved = await msgRef.get();
        return saved.data()!;
    }

    async listMessages(
        conversationId: string,
        limit = 30,
        cursor?: string | null
    ): Promise<{ data: Message[]; nextCursor: string | null }> {
        const msgsCol = this.conversationCollection
            .doc(conversationId)
            .collection("messages")
            .withConverter(MessageConverter);
        let query = msgsCol.orderBy("createdAt", "desc").limit(limit);
        if (cursor) {
            const curSnap = await msgsCol.doc(cursor).get();
            if (curSnap.exists) query = query.startAfter(curSnap);
        }
        const snapshot = await query.get();
        const data = snapshot.docs.map((doc) => doc.data());
        const nextCursor =
            snapshot.docs.length === limit
                ? snapshot.docs[snapshot.docs.length - 1].id
                : null;
        return { data: data.reverse(), nextCursor };
    }

    async listConversationsByUser(
        userPhone: string,
        role: Role,
        limit = 20,
        cursor?: string | null
    ): Promise<{ data: Conversation[]; nextCursor: string | null }> {
        const field =
            role === "instructor"
                ? "participants.instructor"
                : "participants.student";
        let query = this.conversationCollection
            .where(field, "==", userPhone)
            .orderBy("updatedAt", "desc")
            .limit(limit);
        if (cursor) {
            const curSnap = await this.conversationCollection.doc(cursor).get();
            if (curSnap.exists) query = query.startAfter(curSnap);
        }
        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) => doc.data());
        const nextCursor =
            snapshot.docs.length === limit
                ? snapshot.docs[snapshot.docs.length - 1].id
                : null;
        return { data: items, nextCursor };
    }
}
