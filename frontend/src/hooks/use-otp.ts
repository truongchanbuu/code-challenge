import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createAccessCode } from "@/utils/api";

export function useSendSmsCode() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (phoneE164: string) => createAccessCode(phoneE164),
    retry: 1,
    onMutate: () => {
      toast.info("Sending code…");
    },
    onSuccess: ({ requestId, to }) => {
      toast.success("Code sent! Check your phone.");
      navigate(
        `/verify/sms?rid=${encodeURIComponent(requestId)}&to=${encodeURIComponent(to)}`,
      );
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Could not send code. Please try again.";
      toast.error(msg);
    },
  });
}
