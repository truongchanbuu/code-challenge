import { studentsKeys } from "@/features/instructors/constants/query-keys";
import type { StudentsPage } from "@/features/instructors/schemas/api.schema";
import type { StudentsQuery } from "@/features/instructors/schemas/query.schema";
import { fetchStudentsPage } from "@/features/instructors/utils/api";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useStudentsInfiniteQuery(query: StudentsQuery) {
  return useInfiniteQuery<StudentsPage>({
    queryKey: studentsKeys.infinite(query),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      fetchStudentsPage({
        query: query.query,
        pageSize: query.pageSize,
        sort: query.sort ?? "username_asc",
        cursor: (pageParam as string | null) ?? undefined,
        signal,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
