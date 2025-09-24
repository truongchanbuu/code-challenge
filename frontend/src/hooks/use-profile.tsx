import { getProfile, updateProfile } from "@/features/profile/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useProfile({ onCloseProfile }: { onCloseProfile?: any } = {}) {
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getProfile,
    staleTime: 5 * 60_000,
  });

  const {
    mutate: updateMuatation,
    isPending: isProfileUpdating,
    mutateAsync: updateMuatationAsync,
  } = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      onCloseProfile();
      toast.success("Update profile successfully!");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Update failed");
    },
  });

  return {
    currentUser,
    isProfileLoading,
    isProfileUpdating,
    updateMuatation,
    updateMuatationAsync,
  };
}
