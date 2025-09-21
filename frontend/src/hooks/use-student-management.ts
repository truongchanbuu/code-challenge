import { studentsKeys } from "@/features/instructors/constants/query-keys";
import type { StudentsPage } from "@/features/instructors/schemas/api.schema";
import type { EditStudentValues } from "@/features/instructors/schemas/student.schema";
import {
  addStudent,
  deleteStudent,
  editStudent,
} from "@/features/instructors/utils/api";
import type { Student } from "@/schemas/user.schema";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phoneNumber: string) => deleteStudent(phoneNumber),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentsKeys.all });
    },
  });
}

export function useAddStudent(opts?: {
  onSuccess?: (created: Student) => void;
  onError?: (message: string) => void;
}) {
  return useMutation({
    mutationFn: addStudent,
    onSuccess: async (response) => {
      opts?.onSuccess?.(response.data);
      toast.success("Created!");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to add student";
      toast.error(msg);
    },
  });
}

export function useUpdateStudent(phone: string, onClose: any) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EditStudentValues) =>
      editStudent(phone, {
        username: data.username,
        email: data.email?.trim() || undefined,
        phoneNumber: data.phoneNumber?.trim() || undefined,
      }),
    onSuccess: (res) => {
      console.log(`res: ${JSON.stringify(res)}`);
      if (res?.ok && res?.data) {
        const updated = res.data as Student;

        queryClient.setQueriesData(
          { queryKey: studentsKeys.all, exact: false },
          (old: InfiniteData<StudentsPage> | undefined) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                items: p.items.map((s) =>
                  (s.phoneNumber ?? "") === phone ? { ...s, ...updated } : s,
                ),
              })),
            };
          },
        );

        queryClient.invalidateQueries({
          queryKey: studentsKeys.all,
          exact: false,
        });

        onClose();
      } else {
        toast.error(res?.error?.message ?? "Update failed");
      }
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Update failed");
    },
  });
}
