import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { validateAccessCode } from "@/utils/api";
import type { Channel } from "@/schemas/otp.schema";

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
    onSuccess: () => {
      toast.success("Signed in!");
      navigate("/");
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
