export type AssignmentType = "lesson_assigned" | "chat_message" | string;
export type NotificationItem = {
    id: string;
    toPhone: string;
    type: AssignmentType;
    title: string;
    body?: string;
    data?: Record<string, any>;
    read: boolean;
    createdAt: Date;
};

export type NotificationBase = {
    type: NotificationItem["type"];
    title: string;
    body?: string;
    data?: Record<string, any>;
};
