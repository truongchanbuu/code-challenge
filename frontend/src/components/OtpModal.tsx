import { useEffect, useState } from "react";
import { X, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Channel } from "@/schemas/otp.schema";
import { validateAccessCode } from "@/utils/api";

type OtpModalProps = {
  open: boolean;
  onClose: () => void;
  channel: Channel;
  value: string;
  onVerified: () => Promise<void> | void;
};

export default function OtpModal({
  open,
  onClose,
  channel,
  value,
  onVerified,
}: OtpModalProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!code.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await validateAccessCode({
        channel,
        value,
        code: code.trim(),
      });
      toast.success("Verified successfully.");
      await onVerified();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Verify OTP</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <p className="mb-4 text-sm text-gray-600">
            Enter OTP sent to{" "}
            <span className="font-medium text-gray-900">
              {channel === "sms" ? "phone number" : "email"}
            </span>{" "}
            <span className="font-medium break-all text-gray-900">{value}</span>
            .
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              autoFocus
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter OTP"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || submitting}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
