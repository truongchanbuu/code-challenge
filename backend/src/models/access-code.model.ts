import { z } from "zod";
import { PhoneSchema } from "./phone.model";
import { UserIdSchema } from "./user.model";
import { FirestoreDataConverter } from "firebase-admin/firestore";
import { toDate } from "../utils/date";

const AccessCodeStatusSchema = z.enum([
    "pending",
    "active",
    "consumed",
    "expired",
    "blocked",
]);
const AccessCodeType = z.enum(["phone", "email"]);
const TargetSchema = z.string().min(3);

export const AccessCodeSchema = z
    .object({
        userId: UserIdSchema,
        phone: PhoneSchema.optional().nullable(),
        type: AccessCodeType.default("phone"),
        target: TargetSchema.optional(),
        codeHash: z.string(),
        attempts: z.number().default(0).optional(),
        maxAttempts: z.number().default(5).optional(),
        status: AccessCodeStatusSchema,
        expiresAt: z.date(),
        sentAt: z.date(),
        consumedAt: z.date().nullable().optional(),
    })
    .superRefine((value, ctx) => {
        if (value.type === "phone") {
            if (!value.target && !value.phone) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Missing target/phone for type=phone",
                    path: ["target"],
                });
            }
        } else {
            if (!value.target) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Missing target for type=email",
                    path: ["target"],
                });
            }
        }
    });

export type AccessCodeStatus = z.infer<typeof AccessCodeStatusSchema>;
export type AccessCode = z.infer<typeof AccessCodeSchema>;
export type AccessCodeType = z.infer<typeof AccessCodeType>;

export const AccessCodeConverter: FirestoreDataConverter<AccessCode> = {
    toFirestore(accessCode: AccessCode) {
        const parsed = AccessCodeSchema.parse(accessCode);
        const type = parsed.type ?? "phone";
        const target =
            parsed.target ??
            (type === "phone" ? (parsed.phone ?? undefined) : undefined);

        if (!target) {
            throw new Error("AccessCodeConverter: target is required");
        }

        return {
            userId: parsed.userId,
            type,
            target,
            phone:
                type === "phone"
                    ? (parsed.phone ?? target)
                    : (parsed.phone ?? null),
            codeHash: parsed.codeHash,
            attempts: parsed.attempts,
            maxAttempts: parsed.maxAttempts,
            status: parsed.status,
            expiresAt: parsed.expiresAt,
            sentAt: parsed.sentAt,
            consumedAt: parsed.consumedAt ?? null,
        };
    },
    fromFirestore(snapshot: any) {
        const data = snapshot.data();
        data.expiresAt = toDate(data.expiresAt)!;
        data.sentAt = toDate(data.sentAt)!;
        data.consumedAt =
            data.consumedAt == null ? null : toDate(data.consumedAt);
        if (!data.type) data.type = "phone";
        if (!data.target && data.phone) data.target = data.phone;

        return AccessCodeSchema.parse(data);
    },
};
