import type { Assignment } from "@/schemas/assignment.schema";
import { EmptyState } from "./EmptyState";
import { AssignmentRow } from "./AssignmentRow";
import { Skeleton } from "@/components/Skeleton";

export function AssignmentsTable(props: {
  isLoading: boolean;
  assignments: Assignment[];
  totalCount: number;
  onMarkDone: (lessonId: string) => void;
  isMarking: boolean;
}) {
  const { isLoading, assignments, totalCount, onMarkDone, isMarking } = props;

  return (
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
          {isLoading && <Skeleton rows={4} />}

          {!isLoading && assignments.length === 0 && (
            <tr>
              <td colSpan={6} className="py-10 text-center">
                <EmptyState
                  title="No lessons"
                  subtitle="New assignments from your instructor will show up here."
                />
              </td>
            </tr>
          )}

          {assignments.map((a) => (
            <AssignmentRow
              key={a.lessonId}
              a={a}
              onMarkDone={onMarkDone}
              isMarking={isMarking}
            />
          ))}
        </tbody>
      </table>

      {!isLoading && assignments.length > 0 && (
        <footer className="border-base-300 border-t p-4 sm:p-6">
          <p className="text-xs opacity-60">
            Showing {assignments.length} of {totalCount}
          </p>
        </footer>
      )}
    </section>
  );
}
