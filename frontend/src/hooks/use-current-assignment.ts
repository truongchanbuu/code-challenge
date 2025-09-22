import { assignmentsKeys } from "@/features/instructors/constants/query-keys";
import { fetchCurrentAssignments } from "@/features/instructors/utils/api";
import { useQuery } from "@tanstack/react-query";

export function useCurrentAssignments(phones: string[]) {
  return useQuery({
    queryKey: assignmentsKeys.assignments(phones),
    enabled: phones.length > 0,
    queryFn: () => fetchCurrentAssignments(phones),
  });
}
