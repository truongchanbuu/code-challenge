import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSocket } from "@/hooks/use-socket";
import { apiCount, apiList, apiRead } from "@/features/notification/utils/api";

export default function NotificationBell() {
  const queryClient = useQueryClient();

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
      queryClient.setQueryData<number>(["notifications", "count"], (n) =>
        Math.max(0, (n ?? 0) - 1),
      );
      queryClient.setQueryData<any[]>(["notifications", "list"], (old) =>
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
      queryClient.setQueryData<number>(
        ["notifications", "count"],
        (v) => (v ?? 0) + 1,
      );
      queryClient.setQueryData<any[]>(["notifications", "list"], (old) =>
        Array.isArray(old) ? [n, ...old].slice(0, 20) : [n],
      );
    };
    socket.on("notify:new", onNew);
    return () => {
      socket.off("notify:new", onNew);
    };
  }, [socket, queryClient]);

  return (
    <div className="group relative">
      <button className="relative cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:hover:bg-gray-800">
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      <div className="invisible absolute right-0 z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white opacity-0 shadow-xl transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unread > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {unread} new
              </span>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All caught up!
              </p>
            </div>
          ) : (
            <div>
              {items.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`dark:hover:bg-gray-750 flex cursor-pointer border-l-2 px-4 py-3 hover:bg-gray-50 ${
                    !notification.read
                      ? "border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
                      : "border-l-transparent"
                  }`}
                  onClick={
                    notification.read
                      ? () => {}
                      : () => markRead.mutate(notification.id)
                  }
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="mt-1 line-clamp-2 text-left text-sm text-gray-600 dark:text-gray-300">
                          {notification.body}
                        </p>
                      )}
                      <p className="mt-2 text-left text-xs text-gray-500 dark:text-gray-400">
                        {new Date(
                          notification.createdAt ?? Date.now(),
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-auto">
                      {!notification.read && (
                        <button
                          className="shrink-0 cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => markRead.mutate(notification.id)}
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
