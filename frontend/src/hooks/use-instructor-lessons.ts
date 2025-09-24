import { lessonsKeys } from "@/features/instructors/constants/query-keys";
import {
  createLesson,
  deleteLesson,
  getLessons,
  updateLesson,
} from "@/features/lessons/utils/api";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function useLessonsQuery(params: { query?: string; pageSize?: number }) {
  const { query = "", pageSize = 20 } = params;

  return useInfiniteQuery({
    queryKey: lessonsKeys.lessons({ query, pageSize }),
    queryFn: ({ pageParam }) =>
      getLessons({ query, pageSize, cursor: pageParam ?? null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: string;
      data: { title?: string; description?: string };
    }) => updateLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonsKeys.lessons() });
      toast.success("Update lesson successfully!");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Update lesson failed");
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonsKeys.lessons() });
      toast.success("Create lesson successfully!");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Create lesson failed");
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonsKeys.lessons() });
      toast.success("Delete lesson successfully!");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Delete lesson failed");
    },
  });
}
