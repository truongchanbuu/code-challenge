import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditStudentSchema,
  type EditStudentValues,
} from "../schemas/student.schema";
import type { Student } from "@/schemas/user.schema";
import { User, Mail, Phone, X, Edit3 } from "lucide-react";
import { useUpdateStudent } from "@/hooks/use-student-management";
import { toast } from "sonner";

export default function EditStudentModal({
  open,
  onClose: onContainerClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student: Pick<Student, "username" | "email" | "phoneNumber"> | null;
}) {
  const { register, handleSubmit, formState, reset, setFocus, getValues } =
    useForm<EditStudentValues>({
      resolver: zodResolver(EditStudentSchema),
      defaultValues: {
        email: student?.email,
        phoneNumber: student?.phoneNumber,
        username: student?.username,
      },
    });

  const onClose = () => {
    reset();
    onContainerClose();
  };

  const originalPhone = useMemo(() => student?.phoneNumber ?? "", [student]);
  useEffect(() => {
    if (open && student) {
      reset(
        {
          username: student.username ?? undefined,
          email: student.email ?? undefined,
          phoneNumber: student.phoneNumber ?? undefined,
        },
        { keepDirty: false, keepTouched: false },
      );
      setTimeout(() => setFocus("username"), 0);
    }
  }, [open, student, reset, setFocus]);

  const mut = useUpdateStudent(originalPhone!, onClose);

  const onInvalid = (errors: any) => {
    const first = Object.values(errors)[0] as any;
    const msg = first?.message || "Please fix the highlighted fields.";
    toast.error(msg);
  };

  const normalize = (k: keyof EditStudentValues, v: any) => {
    if (typeof v === "string") v = v.trim();
    if (v === "") return undefined;
    if (k === "phoneNumber" && typeof v === "string") {
      v = v.replace(/[^\d+]/g, "");
    }
    return v;
  };

  const makePatchFromDirty = (
    dirty: any,
    values: EditStudentValues,
  ): Partial<EditStudentValues> => {
    const patch: Partial<EditStudentValues> = {};
    (Object.keys(dirty) as (keyof EditStudentValues)[]).forEach((k) => {
      const flag = dirty[k];
      if (typeof flag === "boolean" && flag) {
        patch[k] = normalize(k, values[k]);
      }
    });
    return patch;
  };

  const submit = async () => {
    if (!student || mut.isPending) return;
    const vals = getValues();
    const patch = makePatchFromDirty(formState.dirtyFields, vals);

    if (Object.keys(patch).length === 0) {
      toast.info("No changes.");
      return;
    }

    mut.mutate(patch);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 -z-10 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl"
        onSubmit={handleSubmit(submit, onInvalid)}
        noValidate
      >
        <div className="relative rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2">
              <Edit3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Edit Student</h3>
              <p className="mt-1 text-sm text-blue-100">
                Update student information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mut.isPending}
            className="absolute top-4 right-4 rounded-xl p-2 text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-gray-600">Editing record for:</span>
            <span className="rounded-md border bg-white px-2 py-1 font-semibold text-gray-900">
              {originalPhone}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4 text-gray-500" />
              Name
            </label>
            <input
              {...register("username")}
              disabled={mut.isPending}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter full name"
            />
            {formState.errors.username && (
              <p className="flex items-center gap-1 text-sm text-red-600">
                <span className="h-1 w-1 rounded-full bg-red-600" />
                {formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              Email
            </label>
            <input
              {...register("email")}
              disabled={mut.isPending}
              type="email"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="student@example.com"
            />
            {formState.errors.email && (
              <p className="flex items-center gap-1 text-sm text-red-600">
                <span className="h-1 w-1 rounded-full bg-red-600" />
                {formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              Phone Number
            </label>
            <input
              {...register("phoneNumber")}
              disabled={mut.isPending}
              type="tel"
              inputMode="tel"
              placeholder="+84901234567"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-50 disabled:text-gray-500"
            />
            {formState.errors.phoneNumber && (
              <p className="flex items-center gap-1 text-sm text-red-600">
                <span className="h-1 w-1 rounded-full bg-red-600" />
                {formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={mut.isPending}
              className="flex-1 cursor-pointer rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={mut.isPending}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mut.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
