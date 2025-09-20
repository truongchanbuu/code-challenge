import { InputField } from "@/components/form/InputField";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EmailSignInSchema,
  type EmailSignInValues,
} from "@/schemas/auth.schema";

export default function EmailSignInForm({
  onSubmitForm,
}: {
  onSubmitForm: any;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<EmailSignInValues>({
    resolver: zodResolver(EmailSignInSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  const onSubmit = (data: any) => {
    if (onSubmitForm) return onSubmitForm(data);
    console.log("Email submitted:", data.email);
  };

  return (
    <form
      className="form-control space-y-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <InputField
        placeholder="Your Email Address"
        leftIcon={<Mail size={15} />}
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
        required
        hint="We'll send you 6-digits code"
      />

      <button
        type="submit"
        className="btn btn-primary text-primary-content w-full rounded-md p-6 font-medium"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Next"}
      </button>
    </form>
  );
}
