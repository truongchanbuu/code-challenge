import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StudentsQuery } from "../schemas/query.schema";
import { useAppSocket } from "@/hooks/use-socket";
import SearchInput from "@/components/SearchInput";
import AppNavbar from "@/components/AppNavBar";
import StudentsTable from "./StudentTable";
import AddStudentModal from "./AddStudentModal";
import AssignLessonModal from "./AssignLessonModal";
import InstructorLessons from "@/features/lessons/InstructorLessons";
import InstructorChatTab from "@/features/chat/components/InstructorTabBar";
import { useProfile } from "@/hooks/use-profile";

export default function InstructorDashboard() {
  const navigator = useNavigate();
  const [tab, setTab] = useState<"students" | "lessons" | "chat">(
    () => (sessionStorage.getItem("tab") as any) || "students",
  );

  const [query, setQuery] = useState<StudentsQuery>(() => {
    const raw = sessionStorage.getItem("studentsQuery");
    return raw
      ? JSON.parse(raw)
      : { q: "", pageSize: 10, sort: "username_asc" };
  });

  useEffect(() => sessionStorage.setItem("tab", tab), [tab]);
  useEffect(
    () => sessionStorage.setItem("studentsQuery", JSON.stringify(query)),
    [query],
  );

  const [isAddOpen, setAddOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);

  const [presence, setPresence] = useState<Record<string, boolean>>({});
  useAppSocket({
    onPresence: ({ userId, online }) => {
      setPresence((m) => ({ ...m, [userId]: online }));
    },
  });

  const { currentUser } = useProfile();

  const toolbar = (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <SearchInput
          value={query.query ?? ""}
          onChange={(v) => setQuery((q) => ({ ...q, query: v }))}
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
      <div className="mx-auto w-full max-w-7xl">
        {tab !== "chat" && toolbar}

        <div role="tablist" className="tabs tabs-bordered mt-3">
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
          <button
            role="tab"
            className={`tab ${tab === "chat" ? "tab-active" : ""}`}
            onClick={() => setTab("chat")}
          >
            Chat
          </button>
        </div>

        {tab === "students" && (
          <StudentsTable
            query={query}
            onQueryChange={(p: any) => {
              setQuery((q) => ({ ...q, ...p }));
            }}
            onChat={(std: any) =>
              std.phoneNumber &&
              navigator(`/chat/${encodeURIComponent(std.phoneNumber)}`)
            }
            presence={presence}
          />
        )}

        {tab === "lessons" && <InstructorLessons />}

        {tab === "chat" && (
          <InstructorChatTab instructorPhone={currentUser!.phoneNumber} />
        )}
      </div>

      <AssignLessonModal
        open={isAssignOpen}
        onClose={() => setAssignOpen(false)}
      />
      <AddStudentModal open={isAddOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
