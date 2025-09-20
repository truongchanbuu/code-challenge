import { useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, LockKeyhole } from "lucide-react";
import {
  PasswordAccountSchema,
  type PasswordAccountValues,
} from "@/features/instructors/schemas/student.schema";
import { useSetupAccount } from "@/hooks/use-setup-account";
import { toast } from "sonner";

export default function AccountSetup() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => search.get("token") || "", [search]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordAccountValues>({
    resolver: zodResolver(PasswordAccountSchema),
    defaultValues: { username: "", password: "", confirm: "" },
  });

  const m = useSetupAccount();

  useEffect(() => {
    if (!token) {
      toast.error("Missing token. Please open the link from your email.");
    }
  }, [token]);

  const onSubmit = (values: PasswordAccountValues) => {
    m.mutate(
      { token, username: values.username, password: values.password },
      {
        onSuccess: () => {
          toast.success("Setup completed. Redirecting to login...");
          setTimeout(() => navigate("/login"), 800);
        },
        onError: () => toast.error("Account setup failed"),
      },
    );
  };

  return (
    <div className="min-h-screen place-items-center p-4">
      <div className="w-full max-w-2xl">
        <div className="card border-base-content/10 border shadow-xl">
          <div className="card-body p-8">
            <header className="mb-8 text-center">
              <div className="avatar mb-4">
                <div className="bg-primary/10 border-primary/20 w-16 rounded-full border-2">
                  <div className="flex h-full w-full items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold">Account Setup</h1>
              <p className="text-base-content/70">
                Set your username and password to get started
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="form-control">
                <div className="join w-full">
                  <span className="join-item btn btn-ghost pointer-events-none">
                    <User size={16} className="text-base-content/50" />
                  </span>
                  <input
                    aria-label="Username"
                    className="join-item input input-bordered focus:input-primary w-full"
                    placeholder="Enter your username"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <label className="label w-full pt-2 pl-11">
                    <span className="label-text-alt text-error">
                      {errors.username.message}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <div className="join w-full">
                  <span className="join-item btn btn-ghost pointer-events-none">
                    <LockKeyhole size={16} className="text-base-content/50" />
                  </span>
                  <input
                    aria-label="Password"
                    type="password"
                    className="join-item input input-bordered focus:input-primary w-full"
                    placeholder="Create a secure password"
                    required
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <label className="label w-full pt-2 pl-11">
                    <span className="label-text-alt text-error">
                      {errors.password.message}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <div className="join w-full">
                  <span className="join-item btn btn-ghost pointer-events-none">
                    <LockKeyhole size={16} className="text-base-content/50" />
                  </span>
                  <input
                    aria-label="Confirm Password"
                    type="password"
                    className="join-item input input-bordered focus:input-primary w-full"
                    placeholder="Confirm your password"
                    {...register("confirm")}
                  />
                </div>
                {errors.confirm && (
                  <label className="label w-full pt-2 pl-11">
                    <span className="label-text-alt text-error">
                      {errors.confirm.message}
                    </span>
                  </label>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={m.isPending || !token}
                  className="btn btn-primary btn-lg w-full"
                >
                  {m.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer className="mt-6 text-center">
          <p className="text-base-content/60 text-sm">
            Need help?{" "}
            <a href="#" className="link link-primary font-medium">
              Contact support
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
