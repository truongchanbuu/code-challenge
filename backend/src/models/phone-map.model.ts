import { z } from "zod";

export const PhoneMapSchema = z.object({
    userId: z.string(),
    createdAt: z.date(),
});

export type PhoneMap = z.infer<typeof PhoneMapSchema>;
