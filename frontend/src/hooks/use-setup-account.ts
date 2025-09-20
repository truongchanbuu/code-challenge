import { setupAccount } from "@/utils/api";
import { useMutation } from "@tanstack/react-query";

export function useSetupAccount() {
  return useMutation({
    mutationFn: setupAccount,
  });
}
