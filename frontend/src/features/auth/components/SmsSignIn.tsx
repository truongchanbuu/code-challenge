import { InputField } from "@/components/form/InputField";
import { autoE164 } from "@/utils/phone";
import { Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SmsSignInSchema, type SmsSignInValues } from "@/schemas/auth.schema";

export default function SmsSignInForm({ onSubmitForm }: { onSubmitForm: any }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SmsSignInValues>({
    resolver: zodResolver(SmsSignInSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { phone: "" },
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
        placeholder="Your Phone Number"
        leftIcon={<Phone size={15} />}
        inputMode="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone", {
          onChange: (e) => {
            const value = e.target.value as string;
            const phoneE164 = autoE164(value);
            if (phoneE164 !== value) {
              setValue("phone", phoneE164, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          },
        })}
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
