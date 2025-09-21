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
import { SortType } from "../types/db";

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

    async getUserByUsername(username?: string): Promise<User | null> {
        try {
            if (!username) return null;
            const snap = await this.userCollection
                .where("username", "==", username.toLowerCase().trim())
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

    async listStudentsByInstructor({
        instructorPhone,
        query,
        pageSize = 20,
        sort = "username_asc",
        cursor,
    }: {
        instructorPhone: string;
        query?: string;
        pageSize?: number;
        sort?: SortType;
        cursor?: string | null;
    }) {
        try {
            if (!instructorPhone?.trim()) {
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            const normalized = normalizePhone(instructorPhone);
            if (!normalized) {
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            pageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

            let studentRef = this.userCollection
                .where("role", "==", "student")
                .where("instructor", "==", normalized);

            let orderField: string = "username";
            const hasQuery = !!query?.trim();
            let prefix: string | null = null;

            if (hasQuery) {
                const raw = query!.trim();
                if (raw.includes("@")) {
                    orderField = "email";
                    prefix = raw.toLowerCase();
                } else if (/^[+\d]/.test(raw)) {
                    orderField = "phoneNumber";
                    prefix = raw;
                } else {
                    orderField = "username";
                    prefix = raw;
                }

                studentRef = studentRef
                    .orderBy(orderField, "asc")
                    .where(orderField, ">=", prefix)
                    .where(orderField, "<=", prefix + "\uf8ff");
            } else {
                if (sort === "createdAt_desc") {
                    orderField = "createdAt";
                    studentRef = studentRef.orderBy("createdAt", "desc");
                } else if (sort === "username_desc") {
                    orderField = "username";
                    studentRef = studentRef.orderBy("username", "desc");
                } else {
                    orderField = "username";
                    studentRef = studentRef.orderBy("username", "asc");
                }
            }

            if (cursor) {
                const { lastValue, lastId } = JSON.parse(
                    Buffer.from(cursor, "base64").toString()
                );
                studentRef = studentRef.startAfter(lastValue, lastId);
            }

            const snapshot = await studentRef.limit(pageSize).get();

            const items = snapshot.docs.map((d) => d.data());
            const lastDoc =
                snapshot.docs.length > 0
                    ? snapshot.docs[snapshot.docs.length - 1]
                    : null;

            const nextCursor = lastDoc
                ? Buffer.from(
                      JSON.stringify({
                          lastValue: lastDoc.get(orderField),
                          lastId: lastDoc.id,
                      })
                  ).toString("base64")
                : null;

            let total: number | null = null;
            try {
                const base = this.userCollection
                    .where("role", "==", "student")
                    .where("instructor", "==", normalized);

                const countRef = hasQuery
                    ? base
                          .where(orderField, ">=", prefix!)
                          .where(orderField, "<=", prefix! + "\uf8ff")
                    : base;

                const agg = await countRef.count().get();
                total = agg.data()?.count ?? null;
            } catch {
                total = null;
            }

            return { items, total, nextCursor };
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to list students by instructor.",
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

                tx.update(userRef, {
                    ...payload,
                    updatedAt: FieldValue.serverTimestamp(),
                });
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

            await userRef.update({
                lastLoginAt: FieldValue.serverTimestamp(),
            });
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
            passwordHashed: string;
            emailVerified: boolean;
            updatedAt: Date;
        }
    ) {
        try {
            const userRef = this.userCollection.doc(userId);
            await userRef.update(data);
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
}
