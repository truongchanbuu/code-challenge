import z from "zod";
import { PhoneSchema } from "./phone.model";

const Code6DTO = z.string().regex(/^\d{6}$/);

export const CreateAccessCodeDTO = z
    .object({
        phoneNumber: PhoneSchema.optional(),
        email: z.email().optional(),
    })
    .refine((value) => {
        const hasPhone = Boolean(value.phoneNumber);
        const hasEmail = Boolean(value.email);
        return (hasPhone && !hasEmail) || (!hasPhone && hasEmail);
    }, "Provide either phoneNumber or email")
    .strict();

export const ValidateAccessCodeDTO = z
    .object({
        phoneNumber: PhoneSchema.optional(),
        email: z.email().optional(),
        accessCode: Code6DTO,
    })
    .refine((value) => {
        const hasPhone = Boolean(value.phoneNumber);
        const hasEmail = Boolean(value.email);
        return (hasPhone && !hasEmail) || (!hasPhone && hasEmail);
    }, "Provide either phoneNumber or email")
    .strict();
