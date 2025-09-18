import {
    CollectionReference,
    FieldValue,
    Firestore,
    Transaction,
} from "firebase-admin/firestore";
import { User, UserConverter } from "../models/user.model";
import { normalizePhone } from "../utils/phone";
import { PhoneIndex, PhoneIndexConverter } from "../models/phone-index.model";
import { DatabaseError, ERROR_CODE } from "../config/error";

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
            if (!data.phone)
                throw new DatabaseError(
                    "Phone is required",
                    ERROR_CODE.VALIDATION
                );

            const normalizedPhone = normalizePhone(data.phone);
            if (!normalizedPhone)
                throw new DatabaseError(
                    "Invalid phone.",
                    ERROR_CODE.VALIDATION
                );

            const userId = await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    const phoneRef =
                        this.phoneIndexCollection.doc(normalizedPhone);
                    const phoneSnap = await tx.get(phoneRef);
                    if (phoneSnap.exists)
                        throw new DatabaseError(
                            "Phone is already in use.",
                            ERROR_CODE.CONFLICT
                        );

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
                            updatedAt: now,
                        },
                        { merge: true }
                    );

                    tx.set(
                        phoneRef,
                        {
                            userId: userRef.id,
                            createdAt: now,
                        },
                        { merge: true }
                    );

                    return userRef.id;
                }
            );

            const created = await this.getUserById(userId);
            if (!created)
                throw new DatabaseError(
                    "Cannot create user.",
                    ERROR_CODE.INTERNAL_ERROR
                );
            return created;
        } catch (e) {
            console.error(e);
            if (e instanceof DatabaseError) throw e;
            throw new DatabaseError(
                `Failed to create user: ${e}`,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getUserById(userId: string): Promise<User | null> {
        try {
            const snapshot = await this.userCollection.doc(userId).get();
            return snapshot.data() ?? null;
        } catch (e) {
            console.error(e);
            if (e instanceof DatabaseError) throw e;
            throw new DatabaseError(
                `Failed to get user: ${e}`,
                ERROR_CODE.INTERNAL_ERROR
            );
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
            if (e instanceof DatabaseError) throw e;
            throw new DatabaseError(
                `Failed to get user by email: ${e}`,
                ERROR_CODE.INTERNAL_ERROR
            );
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
            if (e instanceof DatabaseError) throw e;
            throw new DatabaseError(
                `Failed to get user by phone: ${e}`,
                ERROR_CODE.INTERNAL_ERROR
            );
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
                if (!snapshot.exists)
                    throw new DatabaseError(
                        "User not found.",
                        ERROR_CODE.NOT_FOUND
                    );

                const current = snapshot.data()!;
                const currentPhone: string | null = current.phone ?? null;
                if (!currentPhone || currentPhone.trim() === "")
                    throw new DatabaseError(
                        "Fatal insufficient data.",
                        ERROR_CODE.VALIDATION
                    );

                const { phone, email, ...rest } = data;
                const payload: any = {
                    ...rest,
                    userId,
                    role: current.role,
                    createdAt: current.createdAt,
                    lastLoginAt: current.lastLoginAt,
                };

                if (data.phone !== undefined) {
                    if (phone == null || phone.trim() === "")
                        throw new DatabaseError(
                            "Phone cannot be empty.",
                            ERROR_CODE.VALIDATION
                        );

                    const incomingPhone = normalizePhone(phone);
                    if (!incomingPhone)
                        throw new DatabaseError(
                            "Invalid phone number.",
                            ERROR_CODE.VALIDATION
                        );

                    if (incomingPhone !== currentPhone) {
                        const newPhoneRef =
                            this.phoneIndexCollection.doc(incomingPhone);
                        const newSnap = await tx.get(newPhoneRef);
                        if (newSnap.exists)
                            throw new DatabaseError(
                                "Phone is already in use.",
                                ERROR_CODE.CONFLICT
                            );

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
                        throw new DatabaseError(
                            "Invalid data.",
                            ERROR_CODE.VALIDATION
                        );
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
            if (e instanceof DatabaseError) throw e;
            throw new DatabaseError(
                `Failed to update user: ${e}`,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async deleteUser(userId: string): Promise<boolean> {
        try {
            const userRef = this.userCollection.doc(userId);
            const result = await this.firestore.runTransaction(async (tx) => {
                const snap = await tx.get(userRef);
                if (!snap.exists) return false;
                const phoneKey = snap.data()?.phone;
                if (phoneKey)
                    tx.delete(this.phoneIndexCollection.doc(phoneKey));
                tx.delete(userRef);
                return true;
            });
            return result;
        } catch (e) {
            console.error(e);
            if (e instanceof DatabaseError) throw e;
            throw new DatabaseError(
                `Failed to delete user: ${e}`,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
