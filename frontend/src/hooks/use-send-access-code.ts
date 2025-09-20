import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sendAccessCode } from "@/utils/api";
import type { Channel } from "@/schemas/otp.schema";

export function useSendAccessCode(channel: Channel) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (value: string) => sendAccessCode({ channel, value }),
    retry: 1,
    onMutate: () => {
      toast.info("Sending code…");
    },
    onSuccess: (response) => {
      const { phoneNumber, email } = response.data;
      const to = phoneNumber ?? email;

      toast.success(
        channel === "sms"
          ? "Code sent! Check your phone."
          : "Code sent! Check your email.",
      );
      navigate(`/verify/${channel}?to=${encodeURIComponent(to)}`);
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
