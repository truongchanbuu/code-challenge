import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSocket } from "@/hooks/use-socket";
import AppNavbar from "@/components/AppNavBar";
import { getAssignments, apiMarkDone } from "../utils/api";
import type { Assignment, AssignmentStatus } from "@/schemas/assignment.schema";
import { AssignmentsHeader } from "./StudentDashboardHeader";
import { AssignmentsTable } from "./AssignmentTable";
import { ErrorBanner } from "./ErrorBanner";
import { useProfile } from "@/hooks/use-profile";
import { assignmentsKeys } from "@/features/instructors/constants/query-keys";
import StudentChatTab from "@/features/chat/components/StudentChatTabBar";

export default function StudentDashboardPage() {
  const queryClient = useQueryClient();
  const { currentUser } = useProfile();

  const [tab, setTab] = useState<"assignments" | "chat">(
    () => (sessionStorage.getItem("student_tab") as any) || "assignments",
  );
  useEffect(() => sessionStorage.setItem("student_tab", tab), [tab]);

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: assignmentsKeys.studentAssignments(
      currentUser?.phoneNumber,
      currentUser?.email,
    ),
    queryFn: getAssignments,
    refetchOnWindowFocus: false,
    enabled: tab === "assignments",
  });

  const invalidAssignmentCount: number =
    (assignments as any).__invalidCount ?? 0;

  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>(
    "all",
  );
  const [searchText, setSearchText] = useState("");

  const filteredAssignments = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return assignments
      .filter((a) =>
        statusFilter === "all" ? true : a.status === statusFilter,
      )
      .filter((a) => (text ? a.title.toLowerCase().includes(text) : true));
  }, [assignments, statusFilter, searchText]);

  const markAssignmentDone = useMutation({
    mutationFn: (lessonId: string) => apiMarkDone(lessonId),
    onMutate: async (lessonId: string) => {
      await queryClient.cancelQueries({ queryKey: ["student", "assignments"] });
      const previousAssignments =
        queryClient.getQueryData<Assignment[]>(["student", "assignments"]) ||
        [];

      const now = new Date();
      const optimistic = previousAssignments.map((assignment) =>
        assignment.lessonId === lessonId
          ? {
              ...assignment,
              status: "done" as const,
              doneAt: now,
              updatedAt: now,
            }
          : assignment,
      );
      queryClient.setQueryData(["student", "assignments"], optimistic);
      return { previousAssignments };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousAssignments) {
        queryClient.setQueryData(
          ["student", "assignments"],
          ctx.previousAssignments,
        );
      }
    },
    onSuccess: (server) => {
      const updatedAt = new Date(server.updatedAt);
      queryClient.setQueryData<Assignment[]>(
        ["student", "assignments"],
        (prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map((assignment) =>
            assignment.lessonId === server.lessonId
              ? { ...assignment, status: "done", doneAt: updatedAt, updatedAt }
              : assignment,
          );
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "assignments"] });
    },
  });

  const { socket } = useAppSocket();
  useEffect(() => {
    if (!socket) return;
    const handleAssigned = () => {
      queryClient.invalidateQueries({ queryKey: ["student", "assignments"] });
    };
    socket.on("lesson:assigned", handleAssigned);
    return () => {
      socket.off("lesson:assigned", handleAssigned);
    };
  }, [socket, queryClient]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header>
        <AppNavbar
          userName={currentUser?.username || "Student"}
          onBellClick={() => {}}
          onProfile={() => {}}
          onSettings={() => {}}
          onLogout={() => {}}
        />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        <div role="tablist" className="tabs tabs-bordered mb-4">
          <button
            role="tab"
            className={`tab ${tab === "assignments" ? "tab-active" : ""}`}
            onClick={() => setTab("assignments")}
          >
            Assignments
          </button>
          <button
            role="tab"
            className={`tab ${tab === "chat" ? "tab-active" : ""}`}
            onClick={() => setTab("chat")}
          >
            Chat
          </button>
        </div>

        {tab === "assignments" && (
          <article
            className="card border-base-300 bg-base-100 border"
            aria-labelledby="assignments-title"
          >
            <header className="border-base-300 border-b p-4 sm:p-6">
              <h2 id="assignments-title" className="sr-only">
                My Lessons (Assignments)
              </h2>
              <AssignmentsHeader
                statusFilter={statusFilter}
                onChangeStatus={setStatusFilter}
                searchText={searchText}
                onChangeSearch={setSearchText}
              />
            </header>

            <section aria-live="polite" className="space-y-3 p-4 sm:p-6">
              {isAssignmentsError && (
                <ErrorBanner
                  message={"Failed to load assignments."}
                  onRetry={() => refetchAssignments()}
                />
              )}
              {!isAssignmentsError && invalidAssignmentCount > 0 && (
                <div className="alert text-sm">
                  {invalidAssignmentCount} assignment(s) were invalid and
                  hidden.
                </div>
              )}
            </section>

            <AssignmentsTable
              isLoading={isAssignmentsLoading}
              assignments={filteredAssignments}
              totalCount={assignments.length}
              onMarkDone={(lessonId) => markAssignmentDone.mutate(lessonId)}
              isMarking={markAssignmentDone.isPending}
            />
          </article>
        )}

        {tab === "chat" && currentUser?.phoneNumber && (
          <StudentChatTab studentPhone={currentUser.phoneNumber} />
        )}
      </main>

      <footer className="border-base-300 bg-base-100 border-t">
        <div className="px[4] mx-auto flex w-full max-w-7xl items-center justify-between py-6 sm:px-6">
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
