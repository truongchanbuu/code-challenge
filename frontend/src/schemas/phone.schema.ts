import { z } from "zod";

export const PhoneSchema = z
  .string()
  .regex(/^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/, {
    error: "Invalid phone number.",
  });

export type PhoneType = z.infer<typeof PhoneSchema>;
