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
  Loader2,
} from "lucide-react";
import type { StudentsQuery } from "../schemas/query.schema";
import type { Student } from "@/schemas/user.schema";
import { studentsKeys } from "../constants/query-keys";
import { useStudentsInfiniteQuery } from "@/hooks/use-student-infos";
import EditStudentModal from "./EditStudentModal";
import DeleteStudentModal from "./DeleteStudentModal";
import { useCurrentAssignments } from "@/hooks/use-current-assignment";

type Props = {
  query: StudentsQuery;
  onQueryChange: (query: Partial<StudentsQuery>) => void;
  onChat: (std: Student) => void;
  presence?: Record<string, boolean>;
};

export default function StudentsTable({
  query: routeQuery,
  onQueryChange,
  onChat,
  presence,
}: Props) {
  const queryClient = useQueryClient();
  const [isEditOpen, setEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const [hoverEmail, setHoverEmail] = useState<string | null>(null);
  const [hoverPhone, setHoverPhone] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentsInfiniteQuery({
    query: routeQuery.query,
    pageSize: routeQuery.pageSize,
    sort: routeQuery.sort,
  });

  const flat = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages?.[0]?.total ?? null;

  const pagePhones = useMemo(
    () => flat.map((s: any) => s.phoneNumber).filter(Boolean),
    [flat],
  );

  const { data: currentMap, isLoading: loadingCurrent } =
    useCurrentAssignments(pagePhones);

  const rows = useMemo(() => {
    return flat.map((raw: any) => {
      const std = { ...raw };
      const online = std.userId ? presence?.[std.userId] : undefined;
      const cur = (currentMap as any)?.[std.phoneNumber] ?? null;
      return {
        ...std,
        status:
          online != null
            ? online
              ? "online"
              : (std.status ?? "offline")
            : std.status,
        currentLesson: cur
          ? { title: cur.title, status: cur.status, lessonId: cur.lessonId }
          : undefined,
      };
    });
  }, [flat, presence, currentMap]);

  const showingFrom = rows.length ? 1 : 0;
  const showingTo = rows.length;

  const toggleSortByName = () =>
    onQueryChange({
      sort:
        routeQuery.sort === "username_asc" ? "username_desc" : "username_asc",
    });

  return (
    <div className="card bg-base-100 -mt-px p-0">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="py-2 text-center whitespace-nowrap">
                <button
                  type="button"
                  onClick={toggleSortByName}
                  aria-label="Sort by name"
                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-80 hover:opacity-100 focus:outline-none"
                  aria-sort={
                    routeQuery.sort?.startsWith("username_")
                      ? routeQuery.sort.endsWith("_asc")
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <span>Name</span>
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                </button>
              </th>

              <th className="py-2 text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-80">
                  Phone
                </span>
              </th>

              <th className="py-2 text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-80">
                  Email
                </span>
              </th>

              <th className="py-2 text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-80">
                  Current Lesson
                </span>
              </th>

              <th className="py-2 text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-80">
                  Status
                </span>
              </th>

              <th className="py-2 text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold opacity-80">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: routeQuery.pageSize }).map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse">
                  <td className="text-center">
                    <div className="bg-base-300 mx-auto h-4 w-40 rounded"></div>
                  </td>
                  <td className="text-center">
                    <div className="bg-base-300 mx-auto h-4 w-28 rounded"></div>
                  </td>
                  <td className="text-center">
                    <div className="bg-base-300 mx-auto h-4 w-52 rounded"></div>
                  </td>
                  <td className="text-center">
                    <div className="bg-base-300 mx-auto h-4 w-28 rounded"></div>
                  </td>
                  <td className="text-center">
                    <div className="bg-base-300 mx-auto h-4 w-16 rounded"></div>
                  </td>
                  <td className="text-center">
                    <div className="bg-base-300 mx-auto h-8 w-32 rounded"></div>
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
                  <td className="text-center">{std.username}</td>

                  <td
                    className="text-center"
                    onMouseEnter={() => setHoverPhone(std.phoneNumber!)}
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
                      {std?.phoneNumber ?? "---"}
                    </span>
                  </td>

                  <td
                    className="text-center"
                    onMouseEnter={() => setHoverEmail(std.phoneNumber!)}
                    onMouseLeave={() => setHoverEmail(null)}
                  >
                    <span
                      className="ellipsis"
                      title={
                        hoverEmail === std.phoneNumber
                          ? (std.email ?? undefined)
                          : undefined
                      }
                    >
                      {std.email ?? "---"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {loadingCurrent ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : std?.currentLesson ? (
                      <div className="space-y-1">
                        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {std.currentLesson.title}
                        </div>
                        <div className="flex justify-center">
                          {std.currentLesson.status === "done" ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">
                        —
                      </span>
                    )}
                  </td>

                  <td className="text-center">
                    <div className="flex justify-center">
                      {std.status === "online" && (
                        <span className="badge badge-success gap-1 font-bold text-white">
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
                    </div>
                  </td>

                  <td className="text-center">
                    <div className="flex justify-center">
                      <div
                        className="join"
                        role="group"
                        aria-label={`Actions for ${std.username}`}
                      >
                        <button
                          className="btn btn-xs join-item"
                          aria-label="Edit"
                          data-testid="btn-edit"
                          onClick={() => {
                            setSelectedStudent(std);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="btn btn-xs join-item"
                          aria-label="Delete"
                          data-testid="btn-delete"
                          onClick={() => {
                            setSelectedStudent(std);
                            setDeleteOpen(true);
                          }}
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
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="border-base-200 flex items-center justify-between gap-3 border-t p-4">
        <div className="flex items-center gap-2">
          <span className="opacity-70">Rows</span>
          <select
            className="select select-bordered select-sm w-20"
            value={routeQuery.pageSize}
            onChange={(e) =>
              onQueryChange({
                pageSize: Number(e.target.value),
              })
            }
            aria-label="Rows per page"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <span className="opacity-70">
            {showingFrom}-{showingTo}
            {total != null ? ` of ${total}` : " of ?"}
          </span>
        </div>

        <button
          className="btn btn-sm"
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
          aria-label="Load more"
        >
          {isFetchingNextPage
            ? "Loading…"
            : hasNextPage
              ? "Load more"
              : "No more"}
        </button>
      </div>
      {isFetching && !isFetchingNextPage && (
        <div className="mt-2 px-4 pb-4 text-xs opacity-60">Updating…</div>
      )}
      {isError && (
        <div className="alert alert-error mx-4 mt-5 mb-4 flex justify-between rounded-md font-bold text-white">
          <span>Failed to load students.</span>
          <button
            className="btn btn-sm rounded-md bg-white"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: studentsKeys.infinite({
                  query: routeQuery.query,
                  pageSize: routeQuery.pageSize,
                  sort: routeQuery.sort,
                }),
              });
              refetch();
            }}
          >
            Retry
          </button>
        </div>
      )}
      <EditStudentModal
        open={isEditOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedStudent(null);
        }}
        student={
          selectedStudent
            ? {
                username: selectedStudent.username,
                email: selectedStudent.email,
                phoneNumber: selectedStudent.phoneNumber,
              }
            : null
        }
      />
      <DeleteStudentModal
        open={isDeleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedStudent((cur) => (isEditOpen ? cur : null));
        }}
        student={selectedStudent}
      />
    </div>
  );
}
