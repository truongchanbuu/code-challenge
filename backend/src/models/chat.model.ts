import { FieldValue, FirestoreDataConverter } from "firebase-admin/firestore";
import { PhoneSchema } from "./phone.model";
import { Role, RoleSchema } from "./role";
import { z } from "zod";
import { toDate } from "../utils/date";

export type Participant = {
    phoneNumber: string;
    role: Role;
};

export const ConversationSchema = z.object({
    id: z.string(),
    participants: z.object({
        instructor: z.string().min(8),
        student: z.string().min(8),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastMessage: z
        .object({
            content: z.string(),
            senderPhone: z.string(),
            createdAt: z.date(),
        })
        .nullable()
        .optional(),
});

export const MessageSchema = z.object({
    id: z.string(),
    conversationId: z.string(),
    senderPhone: z.string(),
    senderRole: RoleSchema,
    content: z.string(),
    createdAt: z.date(),
    readBy: z.array(z.string()).default([]),
});

export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;

export const SendMessageSchema = z.object({
    instructorPhone: PhoneSchema,
    studentPhone: PhoneSchema,
    senderPhone: PhoneSchema,
    senderRole: RoleSchema,
    content: z.string().min(1).max(2000).trim(),
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;

export const GetHistorySchema = z.object({
    instructorPhone: PhoneSchema,
    studentPhone: PhoneSchema,
    limit: z.coerce.number().min(1).max(100).default(30),
    cursor: z.string().nullish(),
});

export type GetHistoryDTO = z.infer<typeof GetHistorySchema>;

export const ListConversationsSchema = z.object({
    userPhone: PhoneSchema,
    role: RoleSchema,
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().nullish(),
});

export type ListConversationsDTO = z.infer<typeof ListConversationsSchema>;

export const ConversationConverter: FirestoreDataConverter<Conversation> = {
    toFirestore(conversation: Conversation) {
        const doc: Record<string, any> = {
            participants: conversation.participants,
            createdAt: conversation.createdAt ?? FieldValue.serverTimestamp(),
            updatedAt: conversation.updatedAt ?? FieldValue.serverTimestamp(),
            lastMessage: conversation.lastMessage
                ? {
                      content: conversation.lastMessage.content,
                      senderPhone: conversation.lastMessage.senderPhone,
                      createdAt:
                          conversation.lastMessage.createdAt ??
                          FieldValue.serverTimestamp(),
                  }
                : null,
        };
        return doc;
    },

    fromFirestore(snap) {
        const data = snap.data() as any;
        const candidate: Conversation = {
            id: data.id ?? snap.id,
            participants: data.participants,
            createdAt: toDate(data.createdAt) ?? new Date(),
            updatedAt: toDate(data.updatedAt) ?? new Date(),
            lastMessage:
                data.lastMessage == null
                    ? null
                    : {
                          content: data.lastMessage.content,
                          senderPhone: data.lastMessage.senderPhone,
                          createdAt:
                              toDate(data.lastMessage.createdAt) ?? new Date(),
                      },
        };

        const parsed = ConversationSchema.safeParse(candidate);
        if (!parsed.success) {
            throw new Error(
                `Conversation schema validation failed: ${parsed.error.message}`
            );
        }
        return parsed.data;
    },
};

export const MessageConverter: FirestoreDataConverter<Message> = {
    toFirestore(msg: Message) {
        const doc: Record<string, any> = {
            conversationId: msg.conversationId,
            senderPhone: msg.senderPhone,
            senderRole: msg.senderRole,
            content: msg.content,
            createdAt: msg.createdAt ?? FieldValue.serverTimestamp(),
            readBy: msg.readBy ?? [],
        };
        return doc;
    },

    fromFirestore(snap) {
        const data = snap.data() as any;
        const candidate: Message = {
            id: data.id ?? snap.id,
            conversationId: data.conversationId,
            senderPhone: data.senderPhone,
            senderRole: data.senderRole,
            content: data.content,
            createdAt: toDate(data.createdAt) ?? new Date(),
            readBy: Array.isArray(data.readBy) ? data.readBy : [],
        };

        const parsed = MessageSchema.safeParse(candidate);
        if (!parsed.success) {
            throw new Error(
                `Message schema validation failed: ${parsed.error.message}`
            );
        }
        return parsed.data;
    },
};
