export type NotificationItem = {
    id: string;
    toPhone: string;
    type: "lesson_assigned";
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
