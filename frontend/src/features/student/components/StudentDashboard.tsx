import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSocket, type PresenceEvent } from "@/hooks/use-socket";
import { storage } from "@/utils/storage";
import {
  PlugZap,
  Plug,
  RefreshCw,
  Phone,
  Circle,
  CircleDashed,
} from "lucide-react";

export default function StudentDashboard() {
  // Chỉ hiển thị demo; presence hiện dùng userId
  const myPhone = useMemo(() => storage?.phoneNumber || null, []);

  const [presenceLog, setPresenceLog] = useState<
    Array<PresenceEvent & { ts: number }>
  >([]);

  const onPresence = useCallback((e: PresenceEvent) => {
    console.log("[FE] presence <-", e); // DEBUG
    setPresenceLog((prev) => [{ ...e, ts: Date.now() }, ...prev].slice(0, 50));
  }, []);

  const { socket, connected } = useAppSocket({ onPresence });

  // DEBUG: log connect/disconnect/error
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => console.log("[FE] socket connected", socket.id);
    const onDisconnect = (r: any) => console.log("[FE] socket disconnected", r);
    const onErr = (e: any) =>
      console.error("[FE] connect_error", e?.message || e);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onErr);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onErr);
    };
  }, [socket]);

  const doDisconnect = () => {
    console.log("[FE] click disconnect");
    socket?.connected && socket.disconnect();
  };
  const doConnect = () => {
    console.log("[FE] click connect");
    !socket?.connected && socket?.connect();
  };
  const askSnapshot = () =>
    socket?.emit("presence:list", (res: { onlineUserIds: string[] }) => {
      console.log("[FE] presence:list <-", res); // DEBUG
      setPresenceLog((prev) =>
        [
          ...res.onlineUserIds.map((uid) => ({
            userId: uid,
            phoneNumber: null,
            online: true,
            ts: Date.now(),
          })),
          ...prev,
        ].slice(0, 50),
      );
    });

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Student Dashboard</h1>
        <span className={`badge ${connected ? "badge-success" : ""}`}>
          {connected ? "realtime: connected" : "realtime: disconnected"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card bg-base-100">
          <div className="card-body">
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Phone className="h-4 w-4" />
              <span>Phone</span>
            </div>
            <div className="text-lg font-medium">
              {myPhone ?? "(from token on server)"}
            </div>

            <div className="divider my-2" />

            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <Circle className="text-success h-3.5 w-3.5" />
                  <span className="font-medium">Online</span>
                </>
              ) : (
                <>
                  <CircleDashed className="h-3.5 w-3.5" />
                  <span className="opacity-80">Offline</span>
                </>
              )}
            </div>

            <div className="card-actions mt-4 flex gap-2">
              <button
                className="btn btn-sm"
                onClick={doDisconnect}
                disabled={!connected}
              >
                <Plug className="h-4 w-4" /> Disconnect
              </button>
              <button
                className="btn btn-sm"
                onClick={doConnect}
                disabled={connected}
              >
                <PlugZap className="h-4 w-4" /> Connect
              </button>
              <button
                className="btn btn-sm"
                onClick={askSnapshot}
                disabled={!connected}
              >
                <RefreshCw className="h-4 w-4" /> Snapshot
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <div className="text-sm opacity-70">How to test</div>
            <ul className="mt-2 list-disc pl-5 text-sm">
              <li>
                Mở InstructorDashboard (đang lắng nghe presence theo userId).
              </li>
              <li>Mở StudentDashboard này → Instructor thấy online.</li>
              <li>Disconnect ở đây → Instructor thấy offline.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mt-4">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Presence events</h2>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setPresenceLog([])}
            >
              Clear
            </button>
          </div>
          {presenceLog.length === 0 ? (
            <div className="text-sm opacity-60">No events yet.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {presenceLog.map((e, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="font-mono">
                    {e.userId}
                    {e.phoneNumber ? ` · ${e.phoneNumber}` : ""}
                  </span>
                  <span className={`badge ${e.online ? "badge-success" : ""}`}>
                    {e.online ? "online" : "offline"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
