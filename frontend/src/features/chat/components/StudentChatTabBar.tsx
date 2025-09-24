import React from "react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "@/features/chat/schema";
import { useConversations } from "@/hooks/use-chat";
import ConversationList from "./ConversationList";

type Props = { studentPhone: string };

export default function StudentChatTab({ studentPhone }: Props) {
  const navigate = useNavigate();
  const { data: rawConvos = [], isLoading } = useConversations(
    studentPhone,
    "student" as any,
  );

  const items: Conversation[] = rawConvos.map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    lastMessage: c.lastMessage
      ? { ...c.lastMessage, createdAt: new Date(c.lastMessage.createdAt) }
      : null,
  }));

  const [activeId, setActiveId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!activeId && items[0]) setActiveId(items[0].id);
  }, [items, activeId]);

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton rounded-box h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ConversationList
        items={items}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          const conv = items.find((c) => c.id === id);
          const instructor = conv?.participants.instructor;
          if (instructor) {
            navigate(`/chat/${encodeURIComponent(instructor)}`);
          }
        }}
      />
    </div>
  );
}
