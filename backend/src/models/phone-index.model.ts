import { z } from "zod";
import { UserIdSchema } from "./user.model";
import { FirestoreDataConverter, Timestamp } from "firebase-admin/firestore";

export const PhoneIndexSchema = z.object({
    userId: UserIdSchema,
    createdAt: z.date(),
    updatedAt: z.date().optional(),
});

export type PhoneIndex = z.infer<typeof PhoneIndexSchema>;

export const PhoneIndexConverter: FirestoreDataConverter<PhoneIndex> = {
    toFirestore(data: PhoneIndex) {
        return {
            userId: data.userId,
            createdAt: toDate(data.createdAt),
        };
    },
    fromFirestore(snapshot: any) {
        const data = snapshot.data();
        const parsed = PhoneIndexSchema.safeParse({
            userId: data.userId,
            createdAt: toDate(data.createdAt) ?? new Date(),
        });

        if (!parsed.success) {
            throw new Error(
                "PhoneIndex schema validation failed: " + parsed.error.message
            );
        }

        return parsed.data;
    },
};
