import { z } from "zod";
import { PhoneSchema } from "./phone.schema";

export const SmsSignInSchema = z.object({ phone: PhoneSchema });
export type SmsSignInValues = z.infer<typeof SmsSignInSchema>;

export const EmailSignInSchema = z.object({ email: z.email() });
export type EmailSignInValues = z.infer<typeof EmailSignInSchema>;

export const PasswordSignInSchema = z.object({
  username: z.string().min(3).max(100),
  password: z
    .string()
    .min(8, "Password has at least 8 characters.")
    .max(128, "Password has too long."),
});

export type PasswordSignInValues = z.infer<typeof PasswordSignInSchema>;

export const OtpSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter 6 digits")
    .max(6, "Enter 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type OtpValues = z.infer<typeof OtpSchema>;
