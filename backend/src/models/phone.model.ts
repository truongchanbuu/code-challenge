import { z } from "zod";

export const PhoneSchema = z
    .string()
    .regex(/^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/);

export type Phone = z.infer<typeof PhoneSchema>;
