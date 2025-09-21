import { z } from "zod";
import { RoleSchema } from "./role";
import { PhoneSchema } from "./phone.model";
import { FieldValue, FirestoreDataConverter } from "firebase-admin/firestore";
import { toDate } from "../utils/date";

export const UserIdSchema = z.string().nonempty();

export const UserSchema = z.object({
    userId: UserIdSchema,
    phoneNumber: PhoneSchema.optional(),
    role: RoleSchema,
    email: z.email().optional(),
    username: z.string().min(2).max(100),
    isActive: z.boolean().default(false),
    isBanned: z.boolean().default(false),
    createdAt: z.date(),
    emailVerified: z.boolean().default(false),
    passwordHashed: z.string().min(8).max(128).optional(),
    updatedAt: z.date().optional().nullable(),
    lastLoginAt: z.date().optional().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const UserConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User) {
        const doc: Record<string, any> = {
            userId: user.userId,
            phoneNumber: user.phoneNumber,
            role: user.role,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt ?? FieldValue.serverTimestamp(),
            updatedAt: user.updatedAt ?? FieldValue.serverTimestamp(),
            lastLoginAt: user.lastLoginAt ?? null,
        };

        return doc;
    },

    fromFirestore(snap) {
        const data = snap.data() as any;
        const candidate: User = {
            userId: data.userId ?? snap.id,
            phoneNumber: data.phoneNumber,
            role: data.role,
            email: data.email,
            username: data.username,
            createdAt: toDate(data.createdAt) ?? new Date(),
            updatedAt: toDate(data.updatedAt),
            lastLoginAt:
                data.lastLoginAt == null ? null : toDate(data.lastLoginAt),
            isActive: data?.isActive ?? false,
            isBanned: data?.isBanned ?? false,
            emailVerified: data.emailVerified ?? false,
            passwordHashed: data.passwordHashed,
        };

        const parsed = UserSchema.safeParse(candidate);
        if (!parsed.success) {
            throw new Error(
                `User schema validation failed: ${parsed.error.message}`
            );
        }

        return parsed.data;
    },
};
