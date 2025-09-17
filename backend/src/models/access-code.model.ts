import { z } from "zod";
import { PhoneSchema } from "./phone.model";

const AccessCodeStatusSchema = z.enum([
    "active",
    "consumed",
    "expired",
    "blocked",
]);

export const AccessCodeSchema = z.object({
    phone: PhoneSchema,
    codeHash: z.string(),
    attempts: z.number().default(0),
    maxAttempts: z.number().default(5),
    status: AccessCodeStatusSchema,
    expiresAt: z.date(),
    sentAt: z.date(),
    consumedAt: z.date().nullable().optional(),
});

export type AccessCodeStatus = z.infer<typeof AccessCodeStatusSchema>;
export type AccessCode = z.infer<typeof AccessCodeSchema>;
