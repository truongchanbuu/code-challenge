import z from "zod";
import { RoleSchema } from "./role";
import { PhoneSchema } from "./phone.model";

export const CreateUserDTOSchema = z
    .object({
        phoneNumber: PhoneSchema,
        role: RoleSchema,
        email: z.email().optional(),
        username: z.string().min(2).max(100).trim().optional().nullable(),
    })
    .strict();

export type CreateUserDTO = z.infer<typeof CreateUserDTOSchema>;
