import { useEffect, useMemo, useState } from "react";
import {
  useLessonsQuery,
  useDeleteLesson,
  useUpdateLesson,
} from "@/hooks/use-instructor-lessons";
import { formatDate } from "@/utils/date";
import { Skeleton } from "@/components/Skeleton";
import { LoadMoreButton } from "@/components/LoadMoreButton";

export default function InstructorLessons() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    refetch,
  } = useLessonsQuery({ query: debounced, pageSize });

  const flat = useMemo(
    () => (data?.pages ?? []).flatMap((p: any) => p.data),
    [data],
  );

  const total = flat.length;

  const delMutation = useDeleteLesson();
  const updM = useUpdateLesson();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-base-content text-3xl font-bold">Lessons</h1>
          <div className="flex items-center gap-3">
            <div className="bg-base-200/50 flex items-center gap-2 rounded-full px-3 py-1.5">
              <div className="bg-primary h-2 w-2 rounded-full"></div>
              <span className="text-base-content/80 text-sm font-medium">
                {total} lessons
              </span>
            </div>
            <button
              className="btn btn-ghost btn-sm gap-2 rounded-full"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <svg
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-base-100 ring-base-200/50 mb-6 rounded-2xl p-6 shadow-sm ring-1">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="text-base-content/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                className="input input-bordered border-base-200/50 bg-base-50/30 focus:border-primary/30 focus:bg-base-100 w-full rounded-xl pl-10"
                placeholder="Search lessons by title, description, or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-base-content/70 text-sm font-medium">
              Show:
            </label>
            <select
              className="select select-bordered select-sm border-base-200/50 bg-base-50/30 focus:border-primary/30 rounded-xl"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} items
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-base-100 ring-base-200/50 rounded-2xl shadow-sm ring-1">
        {isLoading ? (
          <div className="p-6">
            <Skeleton rows={4} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-error/10 mb-4 rounded-full p-3">
              <svg
                className="text-error h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base-content mb-2 font-semibold">
              Failed to load lessons
            </h3>
            <p className="text-base-content/70 mb-4 text-sm">
              There was an error loading your lessons. Please try again.
            </p>
            <button
              className="btn btn-primary btn-sm rounded-xl"
              onClick={() => refetch()}
            >
              Try Again
            </button>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-base-200/50 mb-4 rounded-full p-4">
              <svg
                className="text-base-content/40 h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-base-content mb-2 text-lg font-semibold">
              No lessons found
            </h3>
            <p className="text-base-content/70 text-sm">
              {debounced
                ? "Try adjusting your search terms"
                : "Start creating lessons to see them here"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="table w-full">
                <thead>
                  <tr className="border-base-200/50">
                    <th className="bg-base-50/30 text-base-content/80 text-left font-semibold">
                      Lesson
                    </th>
                    <th className="bg-base-50/30 text-base-content/80 text-left font-semibold">
                      Description
                    </th>
                    <th className="bg-base-50/30 text-base-content/80 text-center font-semibold">
                      ID
                    </th>
                    <th className="bg-base-50/30 text-base-content/80 text-center font-semibold">
                      Created
                    </th>
                    <th className="bg-base-50/30 text-base-content/80 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flat.map((l, index) => (
                    <tr
                      key={l.lessonId}
                      className="border-base-200/30 hover:bg-base-50/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-base-content font-semibold">
                              {l.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-base-content/70 max-w-md truncate text-sm">
                          {l.description || "No description"}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="bg-base-200/50 text-base-content/80 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium">
                          {l.lessonId}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-base-content/70 text-sm">
                          {formatDate(l.createdAt)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            className="btn btn-ghost btn-xs hover:bg-base-200/50 rounded-lg"
                            onClick={() => {
                              const next = prompt("New title", l.title);
                              if (next && next !== l.title)
                                updM.mutate({
                                  lessonId: l.lessonId,
                                  data: { title: next },
                                });
                            }}
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 hover:text-error rounded-lg"
                            onClick={() => {
                              if (confirm(`Delete "${l.title}"?`))
                                delMutation.mutate(l.lessonId);
                            }}
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="block lg:hidden">
              <div className="divide-base-200/30 divide-y">
                {flat.map((l, index) => (
                  <div key={l.lessonId} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base-content font-semibold">
                            {l.title}
                          </h3>
                          {l.description && (
                            <p className="text-base-content/70 mt-1 line-clamp-2 text-sm">
                              {l.description}
                            </p>
                          )}
                          <div className="text-base-content/60 mt-2 flex items-center gap-3 text-xs">
                            <span className="bg-base-200/50 inline-flex items-center rounded-full px-2 py-0.5">
                              ID: {l.lessonId}
                            </span>
                            <span>{formatDate(l.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-xs rounded-lg"
                          onClick={() => {
                            const next = prompt("New title", l.title);
                            if (next && next !== l.title)
                              updM.mutate({
                                lessonId: l.lessonId,
                                data: { title: next },
                              });
                          }}
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg"
                          onClick={() => {
                            if (confirm(`Delete "${l.title}"?`))
                              delMutation.mutate(l.lessonId);
                          }}
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasNextPage && (
              <LoadMoreButton
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                onClick={() => fetchNextPage()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
