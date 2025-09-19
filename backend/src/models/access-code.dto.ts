import z from "zod";
import { PhoneSchema } from "./phone.model";

const Code6DTO = z.string().regex(/^\d{6}$/);

export const CreateAccessCodeDTO = z
    .object({
        phoneNumber: PhoneSchema,
    })
    .strict();

export const ValidateAccessCodeDTO = z
    .object({
        phoneNumber: PhoneSchema,
        accessCode: Code6DTO,
    })
    .strict();
