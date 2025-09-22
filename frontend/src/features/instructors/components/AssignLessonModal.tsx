import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X, Users, CheckCircle2, User } from "lucide-react";
import { normalizePhone } from "@/utils/phone";
import type { StudentsQuery } from "@/features/instructors/schemas/query.schema";
import { useStudentsInfiniteQuery } from "@/hooks/use-student-infos";
import type { StudentBriefInfo } from "../schemas/student.schema";
import type { AssignModalResult } from "../schemas/assignment.schema";
import { useDebounced } from "@/hooks/use-debounce";
import { useAssignLesson } from "@/hooks/use-student-management";
import { toast } from "sonner";

export default function AssignLessonModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounced(search, 300);
  const studentsQuery = useMemo<StudentsQuery>(
    () => ({ query: searchDebounced, pageSize: 50, sort: "username_asc" }),
    [searchDebounced],
  );
  const [selected, setSelected] = useState<Record<string, StudentBriefInfo>>(
    {},
  );
  const studentsInf = useStudentsInfiniteQuery(studentsQuery);
  const rawItems =
    studentsInf.data?.pages.flatMap(
      (p: any) => p?.items ?? p?.data?.items ?? p?.data ?? [],
    ) ?? [];
  const items: StudentBriefInfo[] = useMemo(
    () =>
      rawItems.map((user: any) => ({
        username: user?.username,
        phoneNumber: user?.phoneNumber,
        email: user?.email,
        status: user?.status,
      })),
    [rawItems],
  );

  const assignMutation = useAssignLesson({ onClose, studentsQuery });

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setSearch("");
      setSelected({});
    }
  }, [open]);

  function togglePick(std: StudentBriefInfo) {
    setSelected((prev) => {
      const key = normalizePhone(std.phoneNumber);
      if (!key) return prev;
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = std;
      return next;
    });
  }

  function selectAllLoaded() {
    const map: Record<string, StudentBriefInfo> = { ...selected };
    for (const std of items) {
      const key = normalizePhone(std.phoneNumber);
      if (key) map[key] = std;
    }
    setSelected(map);
  }

  const assignees = Object.keys(selected);

  async function onSubmit() {
    if (!title.trim()) return toast.error("Please enter lesson title");
    if (assignees.length === 0)
      return toast.error("Please select at least 1 student");
    await assignMutation.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      studentPhones: assignees,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 text-base-content mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl shadow-xl">
        <header className="border-base-300 flex items-center justify-between border-b p-6">
          <section className="w-full">
            <h1 className="text-xl font-semibold">Assign Lesson</h1>
            <p className="mt-1 text-sm opacity-70">
              Search, pick students and assign
            </p>
          </section>
          <button
            onClick={onClose}
            className="hover:bg-base-200 rounded-lg p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5 opacity-70" />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 p-6">
            <section className="space-y-4 text-left">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Lesson Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3: Past Simple"
                  className="border-base-300 focus:ring-primary w-full rounded-lg border px-3 py-2 outline-none focus:border-transparent focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes, resources, deadline..."
                  className="border-base-300 focus:ring-primary w-full rounded-lg border px-3 py-2 outline-none focus:border-transparent focus:ring-2"
                />
              </div>

              <div className="bg-base-200/50 rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="text-primary h-5 w-5" />
                  <h2 className="font-medium">Select Students</h2>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-60" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="border-base-300 focus:ring-primary w-full rounded-lg border py-2 pr-4 pl-10 outline-none focus:border-transparent focus:ring-2"
                  />
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 py-1 text-xs"
                      onClick={selectAllLoaded}
                    >
                      Select All (loaded)
                    </button>
                    <button
                      type="button"
                      className="bg-base-200 hover:bg-base-300 rounded-full px-3 py-1 text-xs"
                      onClick={() => setSelected({})}
                    >
                      Clear
                    </button>
                  </div>
                  <span className="text-xs opacity-70">
                    {assignees.length} selected
                  </span>
                </div>

                <div className="border-base-300 bg-base-100 max-h-64 overflow-y-auto rounded-lg border">
                  {studentsInf.isPending ? (
                    <div className="flex items-center gap-2 p-4 text-sm opacity-80">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading students...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="p-4 text-center text-sm opacity-70">
                      No students
                    </div>
                  ) : (
                    <>
                      <div className="divide-base-300 divide-y">
                        {items.map((std) => {
                          const key = normalizePhone(std.phoneNumber);
                          if (!key) return null;
                          const checked = Boolean(selected[key]);
                          return (
                            <label
                              key={key}
                              className="hover:bg-base-200/40 flex cursor-pointer items-center gap-3 p-3"
                            >
                              <input
                                type="checkbox"
                                className="border-base-300 text-primary focus:ring-primary h-4 w-4 rounded"
                                checked={checked}
                                onChange={() => togglePick(std)}
                              />
                              <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
                                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                                  <User className="text-primary h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {std.username || "Unnamed"}
                                  </p>
                                  <p className="truncate text-xs opacity-70">
                                    {normalizePhone(std.phoneNumber)}
                                    {std.email ? ` • ${std.email}` : ""}
                                  </p>
                                </div>
                                {std.status && (
                                  <span className="bg-base-200 rounded-full px-2 py-1 text-xs">
                                    {std.status}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      <div className="border-base-300 border-t p-3">
                        {studentsInf.hasNextPage ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm w-full"
                            onClick={() => studentsInf.fetchNextPage()}
                            disabled={studentsInf.isFetchingNextPage}
                          >
                            {studentsInf.isFetchingNextPage && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {studentsInf.isFetchingNextPage
                              ? "Loading more..."
                              : "Load more"}
                          </button>
                        ) : (
                          <div className="text-center text-xs opacity-60">
                            End of list
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="border-base-300 bg-base-200/30 flex items-center justify-between border-t p-6">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <CheckCircle2 className="text-success h-4 w-4" />
            Ready to assign to{" "}
            <span className="font-medium">{assignees.length}</span> students
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={assignMutation.isPending || assignees.length === 0}
              className="btn btn-primary disabled:opacity-50"
            >
              {assignMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}{" "}
              Assign Lesson
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
