import { useMemo, useState } from "react";
import type { Conversation } from "../schema";
import { RolePill } from "./RolePill";
import { timeAgo } from "@/utils/date";
import SearchInput from "@/components/SearchInput";
import Avatar from "@/components/Avatar";

export default function ConversationList({
  items,
  activeId,
  onSelect,
}: {
  items: Conversation[];
  activeId?: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((c) =>
        `${c.participants.instructor} ${c.participants.student} ${c.lastMessage?.content ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [items, query],
  );

  const isEmpty = !filtered.length;
  const hasQuery = query.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-base-300 border-b p-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search conversations..."
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-32 flex-col items-center justify-center px-4 text-center">
            <div className="text-base-content/60 text-sm">
              {hasQuery
                ? "No conversations match your search"
                : "No conversations yet"}
            </div>
            {hasQuery && (
              <button
                onClick={() => setQuery("")}
                className="text-primary hover:text-primary-focus mt-1 text-xs"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filtered.map((c) => {
              const other = c.participants.student;
              const isActive = activeId === c.id;
              const lastMessageTime = c.lastMessage?.createdAt;

              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`focus:ring-primary/50 my-2 w-full cursor-pointer rounded-lg p-3 text-left transition-all duration-200 hover:scale-[1.01] focus:ring-2 focus:outline-none ${
                    isActive
                      ? "bg-primary/10 ring-primary shadow-sm ring-2"
                      : "bg-base-100 border-base-300 hover:bg-base-200 hover:border-base-400 border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 pt-0.5">
                      <Avatar name={other} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-base-content truncate font-medium">
                          {other}
                        </span>
                        <RolePill role="student" />
                        {lastMessageTime && (
                          <span className="text-base-content/60 ml-auto flex-shrink-0 text-xs">
                            {timeAgo(lastMessageTime)}
                          </span>
                        )}
                      </div>

                      <div className="text-base-content/70 truncate text-sm leading-tight">
                        {c.lastMessage?.content || (
                          <span className="italic">No messages yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
