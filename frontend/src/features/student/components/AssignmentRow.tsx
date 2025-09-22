import { Circle, CircleCheck, CheckCircle2, Loader2 } from "lucide-react";
import type { Assignment } from "@/schemas/assignment.schema";

export function AssignmentRow(props: {
  a: Assignment;
  onMarkDone: (lessonId: string) => void;
  isMarking: boolean;
}) {
  const { a, onMarkDone, isMarking } = props;
  const isAssigned = a.status === "assigned";

  return (
    <tr>
      <td className="font-medium">{a.title}</td>
      <td className="hidden md:table-cell">
        <div className="truncate opacity-80">{a.description}</div>
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
            disabled={isMarking}
            onClick={() => onMarkDone(a.lessonId)}
            title="Mark as done"
          >
            {isMarking ? (
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
}
