import { storage } from "@/utils/storage";
import z from "zod";
import {
  type Conversation,
  type ListConversationsDTO,
  ConversationSchema,
  type GetHistoryDTO,
  GetHistorySchema,
  ListConversationsSchema,
  MessageSchema,
  SendMessageSchema,
  type SendMessageDTO,
  type Message,
} from "../schema";

const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

function qs(obj: Record<string, any>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function listConversations(
  input: ListConversationsDTO,
): Promise<{ items: Conversation[]; nextCursor: string | null }> {
  const dto = ListConversationsSchema.parse(input);
  const url = `${API}/chat${qs({
    userPhone: dto.userPhone,
    role: dto.role,
    limit: dto.limit,
    cursor: dto.cursor ?? null,
  })}`;

  const result = await fetch(url, {
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  if (!result.ok) throw new Error(`GET /chat ${result.status}`);
  const json = await result.json();

  const raw = Array.isArray(json?.data) ? json.data : [];
  const parsed = z.array(ConversationSchema).safeParse(raw);

  if (parsed.success) {
    return { items: parsed.data, nextCursor: json?.nextCursor ?? null };
  } else {
    const items: Conversation[] = [];
    let invalid = 0;
    for (const it of raw) {
      const one = ConversationSchema.safeParse(it);
      if (one.success) items.push(one.data);
      else invalid++;
    }
    (items as any).__invalidCount = invalid;
    return { items, nextCursor: json?.nextCursor ?? null };
  }
}

export async function getHistory(
  input: GetHistoryDTO,
): Promise<{ items: Message[]; nextCursor: string | null }> {
  const dto = GetHistorySchema.parse(input);
  const url = `${API}/chat/history${qs({
    instructorPhone: dto.instructorPhone,
    studentPhone: dto.studentPhone,
    limit: dto.limit,
    cursor: dto.cursor ?? null,
  })}`;

  const result = await fetch(url, {
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  if (!result.ok) throw new Error(`GET /chat/history ${result.status}`);
  const json = await result.json();

  const raw = Array.isArray(json?.data) ? json.data : [];
  const parsed = z.array(MessageSchema).safeParse(raw);

  if (parsed.success) {
    return { items: parsed.data, nextCursor: json?.nextCursor ?? null };
  } else {
    const items: Message[] = [];
    let invalid = 0;
    for (const it of raw) {
      const one = MessageSchema.safeParse(it);
      if (one.success) items.push(one.data);
      else invalid++;
    }
    (items as any).__invalidCount = invalid;
    return { items, nextCursor: json?.nextCursor ?? null };
  }
}

export async function sendMessage(input: SendMessageDTO): Promise<Message> {
  const dto = SendMessageSchema.parse({
    ...input,
    content: input.content?.trim(),
  });

  const result = await fetch(`${API}/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(storage.accessToken
        ? { Authorization: `Bearer ${storage.accessToken}` }
        : {}),
    },
    body: JSON.stringify(dto),
  });
  if (!result.ok) throw new Error(`POST /chat/message ${result.status}`);
  const json = await result.json();

  const one = MessageSchema.safeParse(json?.data);
  if (one.success) return one.data;
  throw new Error("Invalid message response");
}
