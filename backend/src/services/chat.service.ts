import { ChatRepo } from "../repos/chat.repo";
import {
    SendMessageSchema,
    GetHistorySchema,
    ListConversationsSchema,
    type SendMessageDTO,
    type GetHistoryDTO,
    type ListConversationsDTO,
} from "../models/chat.model";
import type { Message, Conversation } from "../models/chat.model";
import { normalizePhone } from "../utils/phone";
import { z } from "zod";

export class ChatService {
    private readonly chatRepo: ChatRepo;
    constructor(deps: { chatRepo: ChatRepo }) {
        this.chatRepo = deps.chatRepo;
    }

    private normalizePhones(dto: {
        instructorPhone: string;
        studentPhone: string;
        senderPhone?: string;
    }) {
        const instructorPhone = normalizePhone(dto.instructorPhone);
        const studentPhone = normalizePhone(dto.studentPhone);
        const senderPhone = dto.senderPhone
            ? normalizePhone(dto.senderPhone)
            : undefined;
        if (
            !instructorPhone ||
            !studentPhone ||
            (dto.senderPhone && !senderPhone)
        ) {
            throw new Error("Invalid phone number");
        }
        return { instructorPhone, studentPhone, senderPhone };
    }

    async sendMessage(input: SendMessageDTO): Promise<Message> {
        try {
            const dto = SendMessageSchema.parse({
                ...input,
                content: input.content?.trim(),
            });
            const { instructorPhone, studentPhone, senderPhone } =
                this.normalizePhones(dto);
            if (
                senderPhone !== instructorPhone &&
                senderPhone !== studentPhone
            ) {
                throw new Error(
                    "Sender is not a participant of this conversation"
                );
            }
            const conversation = await this.chatRepo.getOrCreateConversation(
                instructorPhone,
                studentPhone
            );
            const message = await this.chatRepo.appendMessage(conversation.id, {
                senderPhone,
                senderRole: dto.senderRole,
                content: dto.content,
                readBy: [senderPhone],
            });
            return message;
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                throw new Error(e.message);
            }
            throw new Error(e?.message || "Failed to send message");
        }
    }

    async getHistory(
        input: GetHistoryDTO
    ): Promise<{ data: Message[]; nextCursor: string | null }> {
        try {
            const dto = GetHistorySchema.parse(input);
            const { instructorPhone, studentPhone } = this.normalizePhones(dto);
            const converstaion = await this.chatRepo.getOrCreateConversation(
                instructorPhone,
                studentPhone
            );
            return await this.chatRepo.listMessages(
                converstaion.id,
                dto.limit,
                dto.cursor ?? null
            );
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                throw new Error(e.message);
            }
            throw new Error(e?.message || "Failed to load history");
        }
    }

    async listConversations(
        input: ListConversationsDTO
    ): Promise<{ data: Conversation[]; nextCursor: string | null }> {
        try {
            const dto = ListConversationsSchema.parse(input);
            const userPhone = normalizePhone(dto.userPhone);
            if (!userPhone) {
                throw new Error("Invalid phone number");
            }
            return await this.chatRepo.listConversationsByUser(
                userPhone,
                dto.role,
                dto.limit,
                dto.cursor ?? null
            );
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                throw new Error(e.message);
            }
            throw new Error(e?.message || "Failed to list conversations");
        }
    }
}
