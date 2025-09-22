import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSocket } from "@/hooks/use-socket";
import { apiCount, apiList, apiRead } from "@/utils/api";

export default function NotificationBell() {
  const qc = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: apiCount,
    refetchOnWindowFocus: false,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: apiList,
    refetchOnWindowFocus: false,
  });

  const markRead = useMutation({
    mutationFn: apiRead,
    onSuccess: (_d, id) => {
      qc.setQueryData<number>(["notifications", "count"], (n) =>
        Math.max(0, (n ?? 0) - 1),
      );
      qc.setQueryData<any[]>(["notifications", "list"], (old) =>
        Array.isArray(old)
          ? old.map((x) => (x.id === id ? { ...x, read: true } : x))
          : old,
      );
    },
  });

  const { socket } = useAppSocket();
  useEffect(() => {
    if (!socket) return;
    const onNew = (n: any) => {
      qc.setQueryData<number>(["notifications", "count"], (v) => (v ?? 0) + 1);
      qc.setQueryData<any[]>(["notifications", "list"], (old) =>
        Array.isArray(old) ? [n, ...old].slice(0, 20) : [n],
      );
    };
    socket.on("notify:new", onNew);
    return () => {
      socket.off("notify:new", onNew);
    };
  }, [socket, qc]);

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle indicator"
      >
        {unread > 0 && (
          <span className="badge indicator-item badge-primary badge-xs">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        <Bell className="h-5 w-5" />
      </div>

      <div
        tabIndex={0}
        className="card dropdown-content border-base-300 bg-base-100 z-50 mt-3 w-80 border shadow-xl"
      >
        <div className="card-body p-0">
          <div className="border-base-300 flex items-center justify-between border-b px-4 py-3">
            <div>
              <div className="text-sm font-medium">Notifications</div>
              <div className="text-xs opacity-70">{unread} unread</div>
            </div>
          </div>

          <ul className="divide-base-300 max-h-80 divide-y overflow-auto">
            {items.length === 0 ? (
              <li className="p-4 text-center text-sm opacity-70">
                No notifications
              </li>
            ) : (
              items.map((n: any) => (
                <li
                  key={n.id}
                  className="hover:bg-base-200/40 flex items-start gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="truncate text-xs opacity-70">
                        {n.body}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] opacity-60">
                      {new Date(n.createdAt ?? Date.now()).toLocaleString()}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
