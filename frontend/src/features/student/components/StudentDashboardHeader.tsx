import type { AssignmentStatus } from "@/schemas/assignment.schema";
import { SearchIcon } from "lucide-react";

export function AssignmentsHeader(props: {
  statusFilter: AssignmentStatus | "all";
  onChangeStatus: (v: "all" | AssignmentStatus) => void;
  searchText: string;
  onChangeSearch: (v: string) => void;
}) {
  const { statusFilter, onChangeStatus, searchText, onChangeSearch } = props;

  return (
    <section
      aria-label="Filters"
      className="mb-1 flex flex-col gap-3 sm:mb-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <nav
        role="tablist"
        aria-label="Assignment status filter"
        className="tabs tabs-bordered"
      >
        {(["all", "assigned", "done"] as const).map((status) => (
          <button
            key={status}
            role="tab"
            aria-selected={statusFilter === status}
            className={`tab ${statusFilter === status ? "tab-active" : ""}`}
            onClick={() => onChangeStatus(status)}
          >
            {status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 opacity-60" />
          <input
            value={searchText}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search by title..."
            className="input input-bordered w-full pl-9"
            aria-label="Search assignments by title"
          />
        </div>
      </div>
    </section>
  );
}
