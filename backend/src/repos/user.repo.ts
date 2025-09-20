import {
    CollectionReference,
    FieldValue,
    Firestore,
    Transaction,
} from "firebase-admin/firestore";
import { User, UserConverter } from "../models/user.model";
import { normalizePhone } from "../utils/phone";
import { PhoneIndex, PhoneIndexConverter } from "../models/phone-index.model";
import { AppError, ERROR_CODE } from "../config/error";

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

    async createUser(data: any): Promise<User | null> {
        try {
            if (!data.phoneNumber)
                throw new AppError(
                    "Phone is required",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const normalizedPhone = normalizePhone(data.phoneNumber);
            if (!normalizedPhone)
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const userId = await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    const phoneRef =
                        this.phoneIndexCollection.doc(normalizedPhone);
                    const phoneSnap = await tx.get(phoneRef);
                    if (phoneSnap.exists)
                        throw new AppError(
                            "Phone is already in use.",
                            409,
                            ERROR_CODE.CONFLICT
                        );

                    const userRef = this.userCollection.doc();
                    const now = FieldValue.serverTimestamp();

                    tx.set(userRef, {
                        ...data,
                        userId: userRef.id,
                        phoneNumber: normalizedPhone,
                        email: data.email
                            ? data.email.toLowerCase().trim()
                            : undefined,
                        createdAt: now,
                        updatedAt: now,
                    });

                    tx.set(phoneRef, { userId: userRef.id, createdAt: now });

                    return userRef.id;
                }
            );

            const created = await this.getUserById(userId);
            if (!created)
                throw new AppError(
                    "Cannot create user.",
                    500,
                    ERROR_CODE.INTERNAL_ERROR
                );
            return created;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to create user.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getUserIdByPhone(phoneNumber: string): Promise<string> {
        try {
            if (!phoneNumber?.trim())
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const normalizedPhone = normalizePhone(phoneNumber);
            if (!normalizedPhone)
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const snapshot = await this.phoneIndexCollection
                .doc(normalizedPhone)
                .get();
            if (!snapshot.exists)
                throw new AppError("Not found.", 404, ERROR_CODE.NOT_FOUND);

            return snapshot.data()!.userId;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get userId.",
                500,
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
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get user.",
                500,
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
            console.error(`error: ${e}`);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get user by email.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getUserByPhone(phoneNumber: string): Promise<User | null> {
        try {
            const key = normalizePhone(phoneNumber);
            if (!key) return null;
            const snap = await this.userCollection
                .where("phoneNumber", "==", key)
                .limit(1)
                .get();
            return snap.docs[0]?.data() ?? null;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get user by phone.",
                500,
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
                    throw new AppError(
                        "User not found.",
                        404,
                        ERROR_CODE.NOT_FOUND
                    );

                const current = snapshot.data()!;
                const currentPhone = current.phoneNumber ?? null;
                if (!currentPhone)
                    throw new AppError(
                        "Fatal insufficient data.",
                        400,
                        ERROR_CODE.VALIDATION
                    );

                const { phoneNumber, email, ...rest } = data;
                const payload: any = {
                    ...rest,
                    userId,
                    role: current.role,
                    createdAt: current.createdAt,
                    lastLoginAt: current.lastLoginAt,
                };

                if (data.phoneNumber !== undefined) {
                    if (!phoneNumber?.trim())
                        throw new AppError(
                            "Phone cannot be empty.",
                            400,
                            ERROR_CODE.VALIDATION
                        );

                    const incomingPhone = normalizePhone(phoneNumber);
                    if (!incomingPhone)
                        throw new AppError(
                            "Invalid phone number.",
                            400,
                            ERROR_CODE.VALIDATION
                        );

                    if (incomingPhone !== currentPhone) {
                        const newPhoneRef =
                            this.phoneIndexCollection.doc(incomingPhone);
                        const newSnap = await tx.get(newPhoneRef);
                        if (newSnap.exists)
                            throw new AppError(
                                "Phone is already in use.",
                                409,
                                ERROR_CODE.CONFLICT
                            );

                        tx.set(
                            newPhoneRef,
                            { userId, updatedAt: FieldValue.serverTimestamp() },
                            { merge: true }
                        );
                        tx.delete(this.phoneIndexCollection.doc(currentPhone));
                    }

                    payload.phoneNumber = incomingPhone;
                }

                if (data.email !== undefined) {
                    if (!email?.trim()) {
                        throw new AppError(
                            "Invalid data.",
                            400,
                            ERROR_CODE.VALIDATION
                        );
                    }
                    payload.email = email.trim().toLowerCase();
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
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to update user.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async trackLoginTime(userId: string): Promise<void> {
        try {
            const userRef = this.userCollection.doc(userId);
            const snapshot = await userRef.get();
            if (!snapshot.exists)
                throw new AppError(
                    "User not found.",
                    404,
                    ERROR_CODE.NOT_FOUND
                );

            const payload: any = {
                lastLoginAt: FieldValue.serverTimestamp(),
            };

            await userRef.set(payload, { merge: true });
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to track login time.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async deleteUser(userId: string): Promise<boolean> {
        try {
            const userRef = this.userCollection.doc(userId);
            return await this.firestore.runTransaction(async (tx) => {
                const snapshot = await tx.get(userRef);
                if (!snapshot.exists) return false;
                const phoneKey = snapshot.data()?.phoneNumber;
                if (phoneKey)
                    tx.delete(this.phoneIndexCollection.doc(phoneKey));
                tx.delete(userRef);
                return true;
            });
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to delete user.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async updateAfterAccountSetup(
        userId: string,
        data: {
            username: string;
            passwordHash: string;
            emailVerified: boolean;
            updatedAt: Date;
        }
    ) {
        console.log(`ref: ${JSON.stringify(data)}`);
        const ref = this.userCollection.doc(userId);
        await ref.set(data, { merge: true });
    }
}
