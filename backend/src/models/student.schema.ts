import { z } from "zod";
import { PhoneSchema } from "./phone.model";

export const AddStudentSchema = z.object({
    username: z.string().min(3).max(10),
    phoneNumber: PhoneSchema,
    email: z.email(),
    instructor: PhoneSchema,
    role: z.string().default("student"),
    emailVerified: z.boolean().default(false),
});

export type AddStudentDTO = z.infer<typeof AddStudentSchema>;

export const SetupAccountSchema = z.object({
    token: z.string().min(16),
    username: z.string().min(2).max(100),
    password: z.string().min(8).max(256),
});
