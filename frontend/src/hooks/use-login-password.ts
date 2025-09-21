import { loginPassword } from "@/utils/api";
import { redirectByRole } from "@/utils/auth";
import { storage } from "@/utils/storage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useLoginPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: loginPassword,
    onMutate: () => toast.info("Loggining..."),
    onSuccess: (response) => {
      const { phoneNumber, role, tokens } = response.data;
      const { accessToken } = tokens;

      storage.saveLogin({
        phoneNumber,
        accessToken,
        role,
      });

      toast.success("Signed in!");
      const next = redirectByRole(role);
      navigate(next, { replace: true });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Invalid username or password.";
      toast.error(msg);
    },
  });
}
