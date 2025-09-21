import z from "zod";
import { toDate } from "../utils/date";
import {
    FirestoreDataConverter,
    QueryDocumentSnapshot,
} from "firebase-admin/firestore";

export const SetupTokenPurposeSchema = z.enum(["account_setup"]);
export type SetupTokenPurpose = z.infer<typeof SetupTokenPurposeSchema>;

export const SetupTokenStatusSchema = z.enum(["active", "used", "expired"]);
export type SetupTokenStatus = z.infer<typeof SetupTokenStatusSchema>;

export const SetupTokenSchema = z.object({
    userId: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().min(5),
    tokenHash: z.string().min(32),
    purpose: SetupTokenPurposeSchema.default("account_setup"),
    status: SetupTokenStatusSchema.default("active"),
    createdAt: z.date(),
    expiresAt: z.date(),
    usedAt: z.date().nullable().optional(),
});
export type SetupToken = z.infer<typeof SetupTokenSchema>;

export const SetupTokenConverter: FirestoreDataConverter<SetupToken> = {
    toFirestore(data: SetupToken) {
        const normalized = {
            ...data,
            createdAt: toDate(data.createdAt) ?? data.createdAt,
            expiresAt: toDate(data.expiresAt) ?? data.expiresAt,
            usedAt: data.usedAt ? (toDate(data.usedAt) ?? data.usedAt) : null,
        };
        return SetupTokenSchema.parse(normalized);
    },

    fromFirestore(snapshot: QueryDocumentSnapshot) {
        const raw = snapshot.data();

        const createdAt = toDate(raw.createdAt);
        const expiresAt = toDate(raw.expiresAt);
        const usedAt = raw.usedAt == null ? null : toDate(raw.usedAt);

        return SetupTokenSchema.parse({
            ...raw,
            createdAt,
            expiresAt,
            usedAt,
        });
    },
};
