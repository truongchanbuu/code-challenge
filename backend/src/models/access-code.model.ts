import { z } from "zod";
import { PhoneSchema } from "./phone.model";
import { UserIdSchema } from "./user.model";
import { FirestoreDataConverter } from "firebase-admin/firestore";

const AccessCodeStatusSchema = z.enum([
    "pending",
    "active",
    "consumed",
    "expired",
    "blocked",
]);

export const AccessCodeSchema = z.object({
    userId: UserIdSchema,
    phone: PhoneSchema,
    codeHash: z.string(),
    attempts: z.number().default(0).optional(),
    maxAttempts: z.number().default(5).optional(),
    status: AccessCodeStatusSchema,
    expiresAt: z.date(),
    sentAt: z.date(),
    consumedAt: z.date().nullable().optional(),
});

export type AccessCodeStatus = z.infer<typeof AccessCodeStatusSchema>;
export type AccessCode = z.infer<typeof AccessCodeSchema>;

export const AccessCodeConverter: FirestoreDataConverter<AccessCode> = {
    toFirestore(accessCode: AccessCode) {
        const parsed = AccessCodeSchema.parse(accessCode);
        return {
            userId: parsed.userId,
            phone: parsed.phone,
            codeHash: parsed.codeHash,
            attempts: parsed.attempts,
            maxAttempts: parsed.maxAttempts,
            status: parsed.status,
            expiresAt: parsed.expiresAt,
            sentAt: parsed.sentAt,
            consumedAt: parsed.consumedAt ?? null,
        };
    },
    fromFirestore(snap: any) {
        const d = snap.data();
        d.expiresAt = toDate(d.expiresAt)!;
        d.sentAt = toDate(d.sentAt)!;
        d.consumedAt = d.consumedAt == null ? null : toDate(d.consumedAt);
        return AccessCodeSchema.parse(d);
    },
};
