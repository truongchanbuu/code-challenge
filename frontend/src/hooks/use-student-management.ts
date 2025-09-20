import { studentsKeys } from "@/features/instructors/constants/query-keys";
import type { StudentsQuery } from "@/features/instructors/schemas/query.schema";
import {
  addStudent,
  deleteStudent,
  fetchStudents,
} from "@/features/instructors/utils/api";
import type { Student } from "@/schemas/user.schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useStudentsQuery(query: StudentsQuery) {
  return useQuery({
    queryKey: studentsKeys.list(query),
    queryFn: () => fetchStudents(query),
  });
}

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
