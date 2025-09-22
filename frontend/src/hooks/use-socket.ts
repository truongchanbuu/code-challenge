import { storage } from "@/utils/storage";
import { useEffect, useMemo } from "react";
import { useSocket } from "socket.io-react-hook";

export type PresenceEvent = {
  userId: string;
  phoneNumber?: string | null;
  online: boolean;
};

export function useAppSocket(opts?: {
  onPresence?: (e: PresenceEvent) => void;
}) {
  const token = storage.accessToken;

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
    socket.on("presence", onPresence);

    socket.emit("presence:list", (res: { onlineUserIds: string[] }) => {
      res?.onlineUserIds?.forEach((uid) =>
        opts?.onPresence?.({ userId: uid, phoneNumber: null, online: true }),
      );
    });

    return () => {
      socket.off("presence", onPresence);
    };
  }, [socket, opts?.onPresence]);

  return { connected, socket, error };
}
