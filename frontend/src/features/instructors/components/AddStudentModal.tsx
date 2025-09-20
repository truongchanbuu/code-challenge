import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddStudentSchema,
  type AddStudentValues,
} from "../schemas/student.schema";
import { useAddStudent } from "@/hooks/use-student-management";
import { autoE164 } from "@/utils/phone";
import { storage } from "@/utils/storage";

export default function AddStudentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const first = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, formState, reset, setValue } =
    useForm<AddStudentValues>({
      resolver: zodResolver(AddStudentSchema),
      mode: "onChange",
      defaultValues: {
        username: "",
        phoneNumber: "",
        email: "",
        instructor: storage.phoneNumber!,
      },
    });

  useEffect(() => {
    if (open) setTimeout(() => first.current?.focus(), 0);
    else reset();
  }, [open, reset]);

  const addStudentMutation = useAddStudent({
    onSuccess: () => {
      onClose();
    },
  });

  const submit = (data: AddStudentValues) => {
    if (!addStudentMutation.isPending) addStudentMutation.mutate(data);
  };

  return (
    <dialog
      className={`modal ${open ? "modal-open" : ""}`}
      aria-modal="true"
      role="dialog"
      onClose={onClose}
    >
      <div className="modal-box mx-4 w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Add Student</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="form-control">
            <input
              aria-label="Username"
              className="input input-bordered focus:input-primary w-full"
              placeholder="Enter student name"
              {...register("username")}
              required
              ref={(element) => {
                register("username").ref(element);
                first.current = element;
              }}
            />
            {formState.errors.username && (
              <label className="label w-full pt-1 text-sm">
                <span className="label-text-alt text-error">
                  {formState.errors?.username?.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <input
              aria-label="Phone Number"
              className="input input-bordered focus:input-primary w-full"
              placeholder="Student Phone Number"
              required
              autoComplete="tel"
              type="tel"
              {...register("phoneNumber", {
                onChange: (e) => {
                  const value = e.target.value as string;
                  const phoneE164 = autoE164(value);
                  if (phoneE164 !== value) {
                    setValue("phoneNumber", phoneE164, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
            {formState.errors.phoneNumber && (
              <label className="label w-full pt-1 text-sm">
                <span className="label-text-alt text-error">
                  {formState.errors.phoneNumber.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <input
              aria-label="Email"
              className="input input-bordered focus:input-primary w-full"
              placeholder="student@example.com"
              type="email"
              required
              {...register("email")}
            />
            {formState.errors.email && (
              <label className="label w-full pt-1 text-sm">
                <span className="label-text-alt text-error">
                  {formState.errors.email.message}
                </span>
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={addStudentMutation.isPending || !formState.isValid}
              data-testid="add-submit"
            >
              {addStudentMutation.isPending ? "Saving..." : "Save Student"}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  );
}
