import {
    CollectionReference,
    FieldValue,
    Firestore,
    Transaction,
} from "firebase-admin/firestore";
import { User, UserConverter } from "../models/user.model";
import { normalizePhone } from "../utils/phone";
import { PhoneIndex, PhoneIndexConverter } from "../models/phone-index.model";

export class UserRepo {
    private firestore: Firestore;
    private userCollection: CollectionReference<User>;
    private phoneIndexCollection: CollectionReference<PhoneIndex>;

    constructor({ firestore }: { firestore: Firestore }) {
        this.firestore = firestore;
        this.userCollection = this.firestore
            .collection("users")
            .withConverter(UserConverter);
        this.phoneIndexCollection = this.firestore
            .collection("phone_index")
            .withConverter(PhoneIndexConverter);
    }

    async createUser(data: User): Promise<User | null> {
        try {
            if (!data.phone) {
                return null;
            }

            const normalizedPhone = normalizePhone(data.phone);

            const userId = await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    if (normalizedPhone) {
                        const phoneRef =
                            this.phoneIndexCollection.doc(normalizedPhone);
                        const phoneSnap = await tx.get(phoneRef);
                        if (phoneSnap.exists)
                            throw new Error("Phone is already in use.");
                    }

                    const userRef = this.userCollection.doc();
                    const now = FieldValue.serverTimestamp();

                    tx.set(
                        userRef,
                        {
                            ...data,
                            userId: userRef.id,
                            phone: normalizedPhone,
                            email: data.email
                                ? data.email.toLowerCase().trim()
                                : undefined,
                            createdAt: now,
                        },
                        { merge: true }
                    );

                    if (normalizedPhone) {
                        const phoneRef =
                            this.phoneIndexCollection.doc(normalizedPhone);
                        tx.set(
                            phoneRef,
                            {
                                userId: userRef.id,
                                createdAt: now,
                            },
                            { merge: true }
                        );
                    }

                    return userRef.id;
                }
            );

            const created = await this.getUserById(userId);
            if (!created) throw new Error("Cannot create user.");
            return created;
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to create user: ${e}`);
        }
    }

    async getUserById(userId: string): Promise<User | null> {
        try {
            const snapshot = await this.userCollection.doc(userId).get();
            return snapshot.data() ?? null;
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to get user: ${e}`);
        }
    }

    async getUserByEmail(email?: string): Promise<User | null> {
        try {
            if (!email) return null;
            const snap = await this.userCollection
                .where("email", "==", email.toLowerCase().trim())
                .limit(1)
                .get();
            return snap.docs[0]?.data() ?? null;
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to get user by email: ${e}`);
        }
    }

    async getUserByPhone(phone: string): Promise<User | null> {
        try {
            const key = normalizePhone(phone);
            if (!key) return null;
            const snap = await this.userCollection
                .where("phone", "==", key)
                .limit(1)
                .get();
            return snap.docs[0]?.data() ?? null;
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to get user by phone: ${e}`);
        }
    }

    async updateUser(
        userId: string,
        data: Partial<User>
    ): Promise<User | null> {
        try {
            const userRef = this.userCollection.doc(userId);

            await this.firestore.runTransaction(async (tx: Transaction) => {
                const snapshot = await tx.get(userRef);
                if (!snapshot.exists) throw new Error("User not found.");

                const current = snapshot.data()!;
                const currentPhone: string | null = current.phone ?? null;
                if (!currentPhone || currentPhone.trim() === "")
                    throw new Error("Fatal insufficient data.");

                const { phone, email, ...rest } = data;
                const payload: any = {
                    ...rest,
                    userId,
                    createdAt: current.createdAt,
                    role: current.role,
                };

                if (data.phone !== undefined) {
                    if (phone == null || phone.trim() === "")
                        throw new Error("Phone cannot be empty.");

                    const incomingPhone = normalizePhone(phone);
                    if (!incomingPhone)
                        throw new Error("Invalid phone number.");

                    if (incomingPhone !== currentPhone) {
                        const newPhoneRef =
                            this.phoneIndexCollection.doc(incomingPhone);
                        const newSnap = await tx.get(newPhoneRef);
                        if (newSnap.exists)
                            throw new Error("Phone is already in use.");

                        tx.set(
                            newPhoneRef,
                            { userId, updatedAt: FieldValue.serverTimestamp() },
                            { merge: true }
                        );

                        tx.delete(this.phoneIndexCollection.doc(currentPhone));
                    }

                    payload.phone = incomingPhone;
                }

                if (data.email !== undefined) {
                    if (email == null || email === "") {
                        throw new Error("Invalid data.");
                    } else {
                        payload.email = email.trim().toLowerCase();
                    }
                }

                tx.set(
                    userRef,
                    { ...payload, updatedAt: FieldValue.serverTimestamp() },
                    { merge: true }
                );
            });

            return this.getUserById(userId);
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to update user: ${e}`);
        }
    }

    async deleteUser(userId: string): Promise<boolean> {
        try {
            const userRef = this.userCollection.doc(userId);
            const cur = await userRef.get();
            if (!cur.exists) return false;

            const data = cur.data();
            const phoneKey = data?.phone;
            if (phoneKey) {
                await this.phoneIndexCollection.doc(phoneKey).delete();
            }
            await userRef.delete();
            return true;
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to delete user: ${e}`);
        }
    }
}
