import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MessageInputFormSchema, type MessageInputForm } from "../schema";
import { SendHorizonal } from "lucide-react";

export default function MessageInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (data: MessageInputForm) => void;
  disabled?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageInputForm>({
    resolver: zodResolver(MessageInputFormSchema),
    defaultValues: { content: "" },
  });

  const submit = handleSubmit((data: any) => {
    onSubmit(data);
    reset({ content: "" });
  });

  return (
    <form
      onSubmit={submit}
      className="border-base-300 flex flex-col border-t p-3"
    >
      <div className="flex items-center justify-center gap-2">
        <textarea
          className={`textarea textarea-bordered max-h-40 min-h-[3rem] grow ${
            errors.content ? "textarea-error" : ""
          }`}
          placeholder="Type a message…"
          {...register("content")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          className="btn btn-primary"
          disabled={disabled || isSubmitting}
          type="submit"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
      {errors.content && (
        <p className="text-error mt-1 text-sm">{errors.content.message}</p>
      )}
    </form>
  );
}
