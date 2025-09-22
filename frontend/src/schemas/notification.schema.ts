export type NotificationItem = {
  id: string;
  toPhone: string;
  type: "lesson_assigned" | "chat_message" | string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
};
