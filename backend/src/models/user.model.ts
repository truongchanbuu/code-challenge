import { z } from "zod";
import { RoleSchema } from "./role";
import { PhoneSchema } from "./phone.model";

export const UserSchema = z.object({
    userId: z.string().nonempty(),
    phone: PhoneSchema,
    role: RoleSchema,
    createdAt: z.date(),
    updatedAt: z.date().optional(),
    lastLoginAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;
