import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StudentsQuery } from "../schemas/query.schema";
import type { Student } from "@/schemas/user.schema";
import { useAppSocket } from "@/hooks/use-socket";
import SearchInput from "@/components/SearchInput";
import AppNavbar from "@/components/AppNavBar";
import StudentsTable from "./StudentTable";
import AddStudentModal from "./AddStudentModal";

export default function InstructorDashboard() {
  const navigator = useNavigate();
  const [tab, setTab] = useState<"students" | "lessons">("students");
  const [query, setQuery] = useState<StudentsQuery>(() => {
    const raw = sessionStorage.getItem("studentsQuery");
    return raw
      ? JSON.parse(raw)
      : { query: "", page: 1, pageSize: 10, sort: "name.asc" };
  });

  useEffect(
    () => sessionStorage.setItem("studentsQuery", JSON.stringify(query)),
    [query],
  );

  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDelOpen, setDelOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const { connected } = useAppSocket({
    onPresence: (e: any) => setPresence((m) => ({ ...m, [e.phone]: e.online })),
    onLessonDone: (e: any) => {},
  });

  // const studentsForAssign = useStudentsForAssign(query);

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <SearchInput
          value={query.query ?? ""}
          onChange={(v) => setQuery((q) => ({ ...q, q: v, page: 1 }))}
        />
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setAssignOpen(true)}>
          Assign Lesson
        </button>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          Add Student
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNavbar />
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
        {toolbar}

        <div role="tablist" className="tabs tabs-bordered">
          <button
            role="tab"
            className={`tab ${tab === "students" ? "tab-active" : ""}`}
            onClick={() => setTab("students")}
          >
            Students
          </button>
          <button
            role="tab"
            className={`tab ${tab === "lessons" ? "tab-active" : ""}`}
            onClick={() => setTab("lessons")}
          >
            Lessons
          </button>
        </div>

        {tab === "students" && (
          <StudentsTable
            query={query}
            onQueryChange={(p) => setQuery((q) => ({ ...q, ...p }))}
            onEdit={(std) => {
              setEditing(std);
              setEditOpen(true);
            }}
            onDelete={(std) => {
              setEditing(std);
              setDelOpen(true);
            }}
            onChat={(std) =>
              navigator(`/chat/${encodeURIComponent(std.phoneNumber)}`)
            }
            presence={presence}
          />
        )}

        {tab === "lessons" && (
          <div className="card p-6">
            <div className="opacity-70">Lessons placeholder</div>
          </div>
        )}

        {/* status line */}
        <div className="text-xs opacity-60">
          Realtime: {connected ? "connected" : "disconnected"}
        </div>
      </div>

      <AddStudentModal open={isAddOpen} onClose={() => setAddOpen(false)} />
      {/* <EditStudentModal
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        student={editing}
      /> */}
      {/*<DeleteStudentDialog
        open={isDelOpen}
        onClose={() => setDelOpen(false)}
        student={editing}
      />
      <AssignLessonModal
        open={isAssignOpen}
        onClose={() => setAssignOpen(false)}
        students={studentsForAssign}
      /> */}
    </div>
  );
}

// function useStudentsForAssign(q: StudentsQuery) {
//   // separate fetch ignoring search to show full list in assign dialog (simple approach)
//   const { data } = useQuery({
//     queryKey: ["students-assign"],
//     queryFn: () =>
//       getStudents({ ...q, q: "", page: 1, pageSize: 100, sort: "name.asc" }),
//   });
//   return useMemo(() => (data?.ok ? data.data.items : []), [data]) as Student[];
// }
