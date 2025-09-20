import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Trash2,
  MessageSquareText,
  ArrowUpDown,
  UserCircle2,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import type { StudentsQuery } from "../schemas/query.schema";
import type { Student } from "@/schemas/user.schema";
import { useStudentsQuery } from "@/hooks/use-student-management";
import Pagination from "@/components/Pagination";
import { studentsKeys } from "../constants/query-keys";

type Props = {
  query: StudentsQuery;
  onQueryChange: (q: Partial<StudentsQuery>) => void;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
  onChat: (s: Student) => void;
  presence?: Record<string, boolean>;
};

export default function StudentsTable({
  query,
  onQueryChange,
  onEdit,
  onDelete,
  onChat,
  presence,
}: Props) {
  const queryClient = useQueryClient();
  const [hoverEmail, setHoverEmail] = useState<string | null>(null);
  const [hoverPhone, setHoverPhone] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } =
    useStudentsQuery(query);

  const paged = data?.ok
    ? {
        items: data.data,
        total: data.meta!.total,
        page: data.meta!.page,
        pageSize: data.meta!.pageSize,
      }
    : { items: [], total: 0, page: query.page, pageSize: query.pageSize };

  const rows = useMemo(() => {
    if (!data?.ok) return [];
    return data.data.map((std) => {
      const online = presence?.[std.phoneNumber];
      return online != null
        ? { ...std, status: online ? "online" : (std.status ?? "offline") }
        : std;
    });
  }, [data, presence]);

  return (
    <div className="card bg-base-100">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() =>
                    onQueryChange({
                      sort:
                        query.sort === "name.asc" ? "name.desc" : "name.asc",
                      page: 1,
                    })
                  }
                  aria-label="Sort by name"
                >
                  Name <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </th>
              <th>Phone</th>
              <th>Email</th>
              <th>Current Lesson</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: query.pageSize }).map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse">
                  <td>
                    <div className="bg-base-300 h-4 w-40 rounded"></div>
                  </td>
                  <td>
                    <div className="bg-base-300 h-4 w-28 rounded"></div>
                  </td>
                  <td>
                    <div className="bg-base-300 h-4 w-52 rounded"></div>
                  </td>
                  <td>
                    <div className="bg-base-300 h-4 w-28 rounded"></div>
                  </td>
                  <td>
                    <div className="bg-base-300 h-4 w-16 rounded"></div>
                  </td>
                  <td className="text-right">
                    <div className="bg-base-300 h-8 w-32 rounded"></div>
                  </td>
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  <div className="space-y-2">
                    <UserCircle2 className="mx-auto h-8 w-8 opacity-60" />
                    <div className="opacity-70">
                      No students. Click{" "}
                      <span className="font-medium">Add Student</span> to start.
                    </div>
                    <button className="btn btn-sm" onClick={() => refetch()}>
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((std) => (
                <tr key={std.phoneNumber} data-testid="row">
                  <td>{std.username}</td>

                  <td
                    onMouseEnter={() => setHoverPhone(std.phoneNumber)}
                    onMouseLeave={() => setHoverPhone(null)}
                  >
                    <span
                      className="ellipsis"
                      title={
                        hoverPhone === std.phoneNumber
                          ? std.phoneNumber
                          : undefined
                      }
                    >
                      {std.phoneNumber}
                    </span>
                  </td>

                  <td
                    onMouseEnter={() => setHoverEmail(std.phoneNumber)}
                    onMouseLeave={() => setHoverEmail(null)}
                  >
                    <span
                      className="ellipsis"
                      title={
                        hoverEmail === std.phoneNumber ? std.email : undefined
                      }
                    >
                      {std.email ?? "-"}
                    </span>
                  </td>

                  <td>{std?.currentLesson?.title ?? "---"}</td>

                  <td>
                    {std.status === "online" && (
                      <span className="badge badge-success gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> online
                      </span>
                    )}
                    {std.status === "assigned" && (
                      <span className="badge gap-1">
                        <CircleDashed className="h-3.5 w-3.5" /> assigned
                      </span>
                    )}
                    {(!std.status || std.status === "offline") && (
                      <span className="badge">offline</span>
                    )}
                    {std.status === "done" && (
                      <span className="badge badge-primary">done</span>
                    )}
                  </td>

                  <td className="text-right">
                    <div
                      className="join"
                      role="group"
                      aria-label={`Actions for ${std.username}`}
                    >
                      <button
                        className="btn btn-xs join-item"
                        aria-label="Edit"
                        data-testid="btn-edit"
                        onClick={() => onEdit(std)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="btn btn-xs join-item"
                        aria-label="Delete"
                        data-testid="btn-delete"
                        onClick={() => onDelete(std)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="btn btn-xs join-item"
                        aria-label="Chat"
                        data-testid="btn-chat"
                        onClick={() => onChat(std)}
                      >
                        <MessageSquareText className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="border-base-200 border-t p-4">
        <Pagination
          page={paged.page}
          pageSize={paged.pageSize}
          total={paged.total}
          onPageChange={(p) => onQueryChange({ page: p })}
          onPageSizeChange={(s) => onQueryChange({ pageSize: s, page: 1 })}
        />
        {isFetching && <div className="mt-2 text-xs opacity-60">Updating…</div>}
        {isError && (
          <div className="alert alert-error mt-5 flex justify-between rounded-md font-bold text-white">
            <span>Failed to load students.</span>
            <button
              className="btn btn-sm rounded-md bg-white"
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: studentsKeys.list(query),
                });

                refetch();
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
