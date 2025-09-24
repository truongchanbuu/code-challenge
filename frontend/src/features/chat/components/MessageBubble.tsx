import Avatar from "@/components/Avatar";
import type { Role } from "@/schemas/user.schema";
import { timeAgo } from "@/utils/date";

export function MessageBubble({
  msg,
  meRole,
}: {
  msg: {
    id: string;
    senderPhone: string;
    senderRole: Role;
    content: string;
    createdAt: Date;
    readBy?: string[];
  };
  meRole: Role;
}) {
  const mine = msg.senderRole === meRole;
  return (
    <div className={`chat ${mine ? "chat-end" : "chat-start"}`}>
      <div className="chat-image">
        <Avatar name={msg.senderPhone} />
      </div>
      <div className="chat-header mb-1 text-xs opacity-70">
        {msg.senderPhone} • {timeAgo(msg.createdAt)}
      </div>
      <div
        className={`chat-bubble ${mine ? "chat-bubble-primary" : "bg-base-200 text-base-content"}`}
      >
        {msg.content}
      </div>
      <div className="chat-footer mt-1 text-xs opacity-60">
        {msg.readBy?.length ? "Seen" : "Sent"}
      </div>
    </div>
  );
}
