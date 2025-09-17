import { z } from "zod";
import { RoleSchema } from "./role";
import { PhoneSchema } from "./phone.model";
import { FirestoreDataConverter, Timestamp } from "firebase-admin/firestore";

export const UserIdSchema = z.string().nonempty();

export const UserSchema = z.object({
    userId: UserIdSchema,
    phone: PhoneSchema,
    role: RoleSchema,
    email: z.email().optional(),
    username: z.string().min(2).max(100),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
    lastLoginAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const UserConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User) {
        const doc: Record<string, any> = {
            userId: user.userId,
            phone: user.phone,
            role: user.role,
            email: user.email,
            username: user.username,
            createdAt: toDate(user.createdAt),
            updatedAt: toDate(user.updatedAt),
            lastLoginAt: toDate(user.lastLoginAt),
        };

        Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
        return doc;
    },

    fromFirestore(snap) {
        const d = snap.data() as any;
        const candidate: User = {
            userId: d.userId ?? snap.id,
            phone: d.phone,
            role: d.role,
            email: d.email,
            username: d.username,
            createdAt: d.createdAt?.toDate?.(),
            updatedAt: d.updatedAt?.toDate?.(),
            lastLoginAt: d.lastLoginAt?.toDate?.(),
        };

        const parsed = UserSchema.safeParse(candidate);
        if (!parsed.success) {
            throw new Error(
                "User schema validation failed: " + parsed.error.message
            );
        }

        return parsed.data;
    },
};
