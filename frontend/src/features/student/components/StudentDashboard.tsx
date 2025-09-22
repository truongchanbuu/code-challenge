import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  CheckCircle2,
  Circle,
  CircleCheck,
  Loader2,
  SearchIcon,
} from "lucide-react";

import { useAppSocket } from "@/hooks/use-socket";
import { storage } from "@/utils/storage";
import { AssignmentSchema, type Assignment } from "@/schemas/assignment.schema";
import AppNavbar from "@/components/AppNavBar";
import { apiMe } from "../utils/api";

// -----------------------------
// API helpers (MVP inline)
// -----------------------------
async function apiFetchAssignments(): Promise<Assignment[]> {
  const r = await fetch("/student/myLessons", {
    credentials: "include",
    headers: storage.accessToken
      ? { Authorization: `Bearer ${storage.accessToken}` }
      : undefined,
  });
  if (!r.ok) throw new Error(`GET /student/myLessons ${r.status}`);
  const j = await r.json();

  const raw = Array.isArray(j?.data) ? j.data : [];

  const parsed = z.array(AssignmentSchema).safeParse(raw);
  if (parsed.success) {
    return [...parsed.data].sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
    );
  } else {
    const valid: Assignment[] = [];
    let invalid = 0;
    for (const it of raw) {
      const one = AssignmentSchema.safeParse(it);
      if (one.success) valid.push(one.data);
      else invalid++;
    }

    valid.sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
    );

    (valid as any).__invalidCount = invalid;
    return valid;
  }
}

async function apiMarkDone(lessonId: string): Promise<{
  lessonId: string;
  status: "done";
  updatedAt: string;
}> {
  const r = await fetch("/student/markLessonDone", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(storage.accessToken
        ? { Authorization: `Bearer ${storage.accessToken}` }
        : {}),
    },
    body: JSON.stringify({ lessonId }),
  });
  if (!r.ok) throw new Error(`POST /student/markLessonDone ${r.status}`);
  const j = await r.json();
  return j?.data;
}

export default function StudentAssignments() {
  const qc = useQueryClient();

  const {
    data: list = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student", "assignments"],
    queryFn: apiFetchAssignments,
    refetchOnWindowFocus: false,
  });

  const invalidCount: number = (list as any).__invalidCount ?? 0;

  const [tab, setTab] = useState<"all" | "assigned" | "done">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return list
      .filter((l) => (tab === "all" ? true : l.status === tab))
      .filter((l) =>
        q.trim()
          ? l.title.toLowerCase().includes(q.trim().toLowerCase())
          : true,
      );
  }, [list, tab, q]);

  const markDone = useMutation({
    mutationFn: (lessonId: string) => apiMarkDone(lessonId),
    onMutate: async (lessonId: string) => {
      await qc.cancelQueries({ queryKey: ["student", "assignments"] });
      const prev =
        qc.getQueryData<Assignment[]>(["student", "assignments"]) || [];
      const nowISO = new Date().toISOString();
      const next = prev.map((assignment) =>
        assignment.lessonId === lessonId
          ? {
              ...assignment,
              status: "done" as const,
              doneAt: new Date(nowISO),
              updatedAt: new Date(nowISO),
            }
          : assignment,
      );
      qc.setQueryData(["student", "assignments"], next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["student", "assignments"], ctx.prev);
    },
    onSuccess: (res) => {
      const updated = new Date(res.updatedAt);
      qc.setQueryData<Assignment[]>(["student", "assignments"], (prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map((x) =>
          x.lessonId === res.lessonId
            ? {
                ...x,
                status: "done",
                doneAt: updated,
                updatedAt: updated,
              }
            : x,
        );
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["student", "assignments"] });
    },
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: apiMe,
    staleTime: 5 * 60_000,
  });

  const { socket } = useAppSocket();
  useEffect(() => {
    if (!socket) return;
    const onAssigned = () => {
      qc.invalidateQueries({ queryKey: ["student", "assignments"] });
    };
    socket.on("lesson:assigned", onAssigned);
    return () => {
      socket.off("lesson:assigned", onAssigned);
    };
  }, [socket, qc]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header>
        <AppNavbar
          userName={me?.username || "Student"}
          onBellClick={() => {}}
          onProfile={() => {}}
          onSettings={() => {}}
          onLogout={() => {}}
        />
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        <article
          className="card border-base-300 bg-base-100 border"
          aria-labelledby="assignments-title"
        >
          <header className="border-base-300 border-b p-4 sm:p-6">
            <h2 id="assignments-title" className="sr-only">
              My Lessons (Assignments)
            </h2>

            <section
              aria-label="Filters"
              className="mb-1 flex flex-col gap-3 sm:mb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <nav
                role="tablist"
                aria-label="Assignment status filter"
                className="tabs tabs-bordered"
              >
                {(["all", "assigned", "done"] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={`tab ${tab === t ? "tab-active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 opacity-60" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by title..."
                    className="input input-bordered w-full pl-9"
                    aria-label="Search assignments by title"
                  />
                </div>
              </div>
            </section>
          </header>

          <section aria-live="polite" className="space-y-3 p-4 sm:p-6">
            {isError && (
              <div className="alert alert-error text-sm">
                {(error as any)?.message || "Failed to load assignments."}
              </div>
            )}
            {!isError && invalidCount > 0 && (
              <div className="alert text-sm">
                {invalidCount} assignment(s) were invalid and hidden (schema
                check).
              </div>
            )}
          </section>

          <section
            role="region"
            aria-label="Assignment list"
            className="overflow-x-auto px-4 pb-4 sm:px-6"
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="hidden md:table-cell">Description</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Assigned</th>
                  <th className="hidden lg:table-cell">Updated</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${i}`} className="animate-pulse">
                        <td>
                          <div className="bg-base-300 h-4 w-40 rounded" />
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="bg-base-300 h-4 w-64 rounded" />
                        </td>
                        <td>
                          <div className="bg-base-300 h-4 w-16 rounded" />
                        </td>
                        <td className="hidden md:table-cell">
                          <div className="bg-base-300 h-4 w-28 rounded" />
                        </td>
                        <td className="hidden lg:table-cell">
                          <div className="bg-base-300 h-4 w-28 rounded" />
                        </td>
                        <td className="text-right">
                          <div className="bg-base-300 h-8 w-24 rounded" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mb-1 text-sm opacity-70">
                          No lessons
                        </div>
                        <div className="text-xs opacity-60">
                          New assignments from your instructor will show up
                          here.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {filtered.map((a) => {
                  const isAssigned = a.status === "assigned";
                  return (
                    <tr key={a.lessonId}>
                      <td className="font-medium">{a.title}</td>
                      <td className="hidden md:table-cell">
                        <div className="truncate opacity-80">
                          {a.description}
                        </div>
                      </td>
                      <td>
                        {a.status === "done" ? (
                          <span className="badge badge-primary gap-1">
                            <CircleCheck className="h-3.5 w-3.5" />
                            done
                          </span>
                        ) : (
                          <span className="badge gap-1">
                            <Circle className="h-3.5 w-3.5" />
                            assigned
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-xs opacity-70">
                          {new Date(a.assignedAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-xs opacity-70">
                          {new Date(a.updatedAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-right">
                        {isAssigned ? (
                          <button
                            className="btn btn-sm"
                            disabled={markDone.isPending}
                            onClick={() => markDone.mutate(a.lessonId)}
                            title="Mark as done"
                          >
                            {markDone.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Mark done
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-ghost" disabled>
                            Done
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <footer className="border-base-300 border-t p-4 sm:p-6">
            {!isLoading && filtered.length > 0 && (
              <p className="text-xs opacity-60">
                Showing {filtered.length} of {list.length}
              </p>
            )}
          </footer>
        </article>
      </main>

      {/* Site footer */}
      <footer className="border-base-300 bg-base-100 border-t">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
          <p className="text-xs opacity-60">
            © {new Date().getFullYear()} Online Classroom. All rights reserved.
          </p>
          <nav className="text-xs">
            <a className="link link-hover mr-3" href="/privacy">
              Privacy
            </a>
            <a className="link link-hover" href="/terms">
              Terms
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
