import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentsKeys } from "@/features/instructors/constants/query-keys";
import { deleteStudent } from "../utils/api";
import { X, Trash2 } from "lucide-react";

export default function DeleteStudentModal({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student: any;
}) {
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const id = (student as any)?.phoneNumber ?? "";
      if (!id) throw new Error("Missing student id");
      return deleteStudent(id);
    },
    onSuccess: (res: any) => {
      if (res?.ok) {
        qc.invalidateQueries({ queryKey: ["students"], exact: false });
        qc.invalidateQueries({
          queryKey: studentsKeys?.all ?? ["students"],
          exact: false,
        });
        toast.success("Student deleted");
        onClose();
      } else {
        toast.error(res?.error?.message ?? "Delete failed");
      }
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Delete failed");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <button
          onClick={onClose}
          disabled={mut.isPending}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Delete Student
            </h3>
            <p className="text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {(student as any)?.username ?? "this student"}
              </span>
              ?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mut.isPending}
              className="flex-1 cursor-pointer rounded-xl bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                !mut.isPending &&
                toast.promise(mut.mutateAsync(), {
                  loading: "Deleting…",
                  success: "Deleted",
                  error: (e) => e?.message ?? "Delete failed",
                })
              }
              data-testid="confirm-delete"
              disabled={mut.isPending}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mut.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
