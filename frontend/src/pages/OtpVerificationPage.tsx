import {
  ArrowLeft,
  Mail,
  Phone,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/components/form/InputField";
import { OtpSchema, type OtpValues } from "@/schemas/auth.schema";
import { useParams, useSearchParams } from "react-router-dom";

export default function OtpVerificationPage() {
  const { channel } = useParams<{ channel: "sms" | "email" }>();
  const [searchParams] = useSearchParams();

  if (channel !== "sms" && channel !== "email") {
    return <div className="p-4">Invalid channel</div>;
  }

  const rid = searchParams.get("rid") || "";
  const to = searchParams.get("to") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<OtpValues>({
    resolver: zodResolver(OtpSchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const onBack = () => window.history.back();

  const onSubmit = async ({ code }: OtpValues) => {
    console.log("validate OTP:", { channel, rid, code });
  };

  const onResend = async () => {
    console.log("resend OTP:", { channel, rid, to });
  };

  const title = channel === "sms" ? "Phone verification" : "Email verification";
  const desc =
    channel === "sms"
      ? "Enter the code we sent to your phone"
      : "Enter the code we sent to your email";
  const icon = channel === "sms" ? <Phone size={16} /> : <Mail size={16} />;

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <div className="card border-base-200/60 bg-base-100 w-full max-w-md border shadow-xl">
        <div className="card-body relative space-y-6">
          <div className="absolute left-0 mb-2">
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content gap-2"
              aria-label="Go back"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </button>
          </div>

          <div className="space-y-2 text-center">
            <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              {icon}
            </div>
            <h1 className="text-base-content text-2xl font-bold">{title}</h1>
            <p className="text-base-content/70 text-base">
              {desc}
              {to ? (
                <>
                  {" "}
                  — <span className="text-base-content font-medium">{to}</span>
                </>
              ) : null}
            </p>
          </div>

          <form
            className="form-control space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <InputField
              placeholder="Enter 6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              leftIcon={<ShieldCheck size={16} />}
              error={errors.code?.message}
              hint={errors.code ? undefined : "Enter the 6-digit code"}
              {...register("code", {
                onChange: (e) => {
                  const raw = String(e.target.value || "");
                  const onlyDigits = raw.replace(/\D+/g, "").slice(0, 6);
                  if (onlyDigits !== raw) {
                    setValue("code", onlyDigits, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                },
              })}
              required
            />

            <button
              type="submit"
              className="btn btn-primary text-primary-content w-full rounded-md"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>

          <div className="text-base-content/70 text-center text-sm">
            Code not received?{" "}
            <button
              type="button"
              className="link link-primary no-underline"
              onClick={onResend}
            >
              Send again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
