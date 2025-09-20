import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { validateAccessCode } from "@/utils/api";
import type { Channel } from "@/schemas/otp.schema";
import { storage } from "@/utils/storage";

export function useVerifyAccessCode() {
  const [sp] = useSearchParams();
  const { channel } = useParams<{ channel: Channel }>();
  const navigate = useNavigate();

  const to = sp.get("to") || "";

  return useMutation({
    mutationFn: async (code: string) => {
      if (!channel || !to) throw new Error("Missing verification context.");
      return validateAccessCode({ channel, value: to, code });
    },
    onMutate: () => toast.info("Verifying…"),
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
          : "Invalid or expired code.";
      toast.error(msg);
    },
  });
}

function redirectByRole(role: string) {
  return role === "instructor" ? "/instructor/dashboard" : "/student/dashboard";
}
