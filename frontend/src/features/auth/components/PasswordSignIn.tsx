import { Mail, LockKeyhole, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/components/form/InputField";
import {
  PasswordSignInSchema,
  type PasswordSignInValues,
} from "@/schemas/auth.schema";

export default function PasswordSignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PasswordSignInValues>({
    resolver: zodResolver(PasswordSignInSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: PasswordSignInValues) => {
    console.log("submit:", data);
  };

  return (
    <form
      className="form-control space-y-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <InputField
        placeholder="abc@example.com"
        leftIcon={<Mail size={18} />}
        autoComplete="email"
        inputMode="email"
        type="email"
        error={errors.email?.message}
        required
        {...register("email")}
      />

      <InputField
        placeholder="••••••••"
        leftIcon={<LockKeyhole size={18} />}
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        required
        {...register("password")}
      />

      <div className="flex items-center justify-end text-sm">
        <button
          type="button"
          className="link link-primary no-underline"
          onClick={() => console.log("Forgot password")}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        className="btn btn-primary text-primary-content w-full rounded-md p-6 font-medium"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoaderCircle
              className="animate-spin"
              size={18}
              aria-hidden="true"
            />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
