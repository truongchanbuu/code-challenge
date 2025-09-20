import { storage } from "@/utils/storage";
import { useEffect, useMemo } from "react";
import { useSocket } from "socket.io-react-hook";

type PresenceEvent = { phoneNumber: string; online: boolean };
type LessonDoneEvent = { phoneNumber: string; lessonId: string };

type Opts = {
  onPresence?: (e: PresenceEvent) => void;
  onLessonDone?: (e: LessonDoneEvent) => void;
};

export function useAppSocket(opts?: Opts) {
  const token = storage?.token ?? null;

  const urlOrNs = useMemo(() => {
    const explicit = import.meta.env.VITE_SOCKET_URL?.replace(
      /\/socket\.io.*$/,
      "",
    );
    if (explicit) return explicit;
    const base = import.meta.env.VITE_API_BASE_URL;
    return base ? base.replace(/\/api\/?$/, "") : undefined;
  }, []);

  const { socket, connected, error } = useSocket(urlOrNs, {
    enabled: !!token,
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    auth: token ? { token } : undefined,
  });

  useEffect(() => {
    if (!socket) return;
    const onPresence = (e: PresenceEvent) => opts?.onPresence?.(e);
    const onDone = (e: LessonDoneEvent) => opts?.onLessonDone?.(e);

    socket.on("presence", onPresence);
    socket.on("lesson:done", onDone);
    socket.on("connect_error", (err: any) =>
      console.error("socket connect_error:", err?.message, err),
    );

    return () => {
      socket.off("presence", onPresence);
      socket.off("lesson:done", onDone);
      socket.off("connect_error");
    };
  }, [socket, opts?.onPresence, opts?.onLessonDone]);

  return { connected, socket, error };
}
