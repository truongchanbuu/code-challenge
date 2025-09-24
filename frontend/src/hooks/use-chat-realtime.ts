import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Role } from "@/schemas/user.schema";
import type { SendMessageDTO, Message, Room } from "@/features/chat/schema";
import { conversationsKeys } from "@/features/instructors/constants/query-keys";

type ServerMessage = { room: Room; message: Message; clientId?: string };
type Ack = { ok: boolean; message?: Message };

export function useRealtimeChat(params: {
  socket: any | undefined;
  myPhone: string;
  myRole: Role;
  instructorPhone?: string;
  studentPhone?: string;
}) {
  const { socket, myPhone, myRole, instructorPhone, studentPhone } = params;
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !instructorPhone || !studentPhone) return;
    const room = { instructorPhone, studentPhone };
    socket.emit("room:join", room);

    const onMessage = (evt: ServerMessage) => {
      const { room: r, message, clientId } = evt;
      const i = r.instructorPhone;
      const s = r.studentPhone;

      qc.setQueryData<any[]>(
        conversationsKeys.allConversations(myPhone, myRole),
        (prev) =>
          Array.isArray(prev)
            ? prev.map((c: any) =>
                c.participants?.instructor === i &&
                c.participants?.student === s
                  ? {
                      ...c,
                      lastMessage: {
                        content: message.content,
                        senderPhone: message.senderPhone,
                        createdAt: new Date(message.createdAt),
                      },
                      updatedAt: new Date(message.createdAt),
                    }
                  : c,
              )
            : prev,
      );

      if (i !== instructorPhone || s !== studentPhone) return;

      qc.setQueryData<any[]>(
        conversationsKeys.history(instructorPhone, studentPhone),
        (prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          if (clientId) {
            const idx = arr.findIndex(
              (m: any) => m.__optimisticId === clientId,
            );
            if (idx >= 0) {
              const copy = [...arr];
              copy[idx] = {
                ...message,
                createdAt: new Date(message.createdAt),
              };
              return copy;
            }
          }
          return [
            ...arr,
            { ...message, createdAt: new Date(message.createdAt) },
          ];
        },
      );
    };

    socket.on("chat:message", onMessage);

    return () => {
      socket.emit("room:leave", room);
      socket.off("chat:message", onMessage);
    };
  }, [socket, instructorPhone, studentPhone, qc, myPhone, myRole]);

  const send = useCallback(
    (content: string) => {
      if (!socket || !instructorPhone || !studentPhone) return;
      const clientId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      qc.setQueryData<any[]>(
        conversationsKeys.history(instructorPhone, studentPhone),
        (prev) => [
          ...(Array.isArray(prev) ? prev : []),
          {
            id: `optimistic-${clientId}`,
            __optimistic: true,
            __optimisticId: clientId,
            conversationId: "",
            senderPhone: myPhone,
            senderRole: myRole,
            content,
            createdAt: new Date(),
            readBy: [],
          },
        ],
      );

      qc.setQueryData<any[]>(["conversations", myPhone, myRole], (prev) =>
        Array.isArray(prev)
          ? prev.map((c: any) =>
              c.participants?.instructor === instructorPhone &&
              c.participants?.student === studentPhone
                ? {
                    ...c,
                    lastMessage: {
                      content,
                      senderPhone: myPhone,
                      createdAt: new Date(),
                    },
                    updatedAt: new Date(),
                  }
                : c,
            )
          : prev,
      );

      const payload: SendMessageDTO & { clientId: string } = {
        instructorPhone,
        studentPhone,
        senderPhone: myPhone,
        senderRole: myRole,
        content,
        clientId,
      };

      socket.emit("chat:send", payload, (ack?: Ack) => {
        if (ack && !ack.ok) {
          qc.setQueryData<any[]>(
            ["history", instructorPhone, studentPhone],
            (prev) =>
              Array.isArray(prev)
                ? prev.filter((m) => m.__optimisticId !== clientId)
                : prev,
          );
        }
      });
    },
    [socket, instructorPhone, studentPhone, myPhone, myRole, qc],
  );

  return { send };
}
