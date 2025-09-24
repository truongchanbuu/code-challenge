import { PhoneSchema } from "@/schemas/phone.schema";
import { RoleSchema } from "@/schemas/user.schema";
import { z } from "zod";

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
export type Conversation = z.infer<typeof ConversationSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderPhone: z.string(),
  senderRole: RoleSchema,
  content: z.string(),
  createdAt: z.date(),
  readBy: z.array(z.string()).default([]),
});
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

export const MessageInputFormSchema = z.object({
  content: z
    .string()
    .min(1, { error: "Message is required." })
    .max(2000, { error: "Message is too long." })
    .trim(),
});

export type MessageInputForm = z.infer<typeof MessageInputFormSchema>;

export type Room = { instructorPhone: string; studentPhone: string };
