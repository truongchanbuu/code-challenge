import { PhoneSchema } from "@/schemas/phone.schema";
import z from "zod";

export const AddStudentSchema = z.object({
  username: z
    .string()
    .min(3, { error: "Username should be at least 3 characters" })
    .max(100, { error: "Too long!" }),
  email: z.email({ error: "Invalid email" }),
  phoneNumber: PhoneSchema,
  instructor: PhoneSchema,
});

export const EditStudentSchema = z.object({
  username: z
    .string({ error: "Invalid username." })
    .min(3, { error: "Username should be at least 3 characters" })
    .max(100, { error: "Too long!" })
    .optional(),
  email: z.email({ error: "Invalid email" }).optional(),
  phoneNumber: PhoneSchema.optional(),
});

export type EditStudentValues = z.infer<typeof EditStudentSchema>;

export type AddStudentValues = z.infer<typeof AddStudentSchema>;

export const PasswordAccountSchema = z
  .object({
    username: z.string().min(2).max(100),
    password: z.string().min(8).max(256),
    confirm: z.string().min(8).max(256),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export type PasswordAccountValues = z.infer<typeof PasswordAccountSchema>;

export type StudentBriefInfo = {
  username?: string;
  phoneNumber: string;
  email?: string;
  status?: string;
};
