import {
    CollectionReference,
    Firestore,
    Transaction,
} from "firebase-admin/firestore";
import {
    AccessCode,
    AccessCodeConverter,
    AccessCodeStatus,
} from "../models/access-code.model";
import { normalizePhone } from "../utils/phone";
import { AppError, ERROR_CODE } from "../config/error";

const DEFAULT_LIMIT = 10;

export class AccessCodeRepo {
    private firestore: Firestore;
    private accessCodeCollection: CollectionReference<AccessCode>;

    constructor({ firestore }: { firestore: Firestore }) {
        this.firestore = firestore;
        this.accessCodeCollection = this.firestore
            .collection("accessCodes")
            .withConverter(AccessCodeConverter);
    }

    async saveAccessCode(code: AccessCode): Promise<string> {
        try {
            const normalizedPhone = normalizePhone(code.phone);
            if (!normalizedPhone)
                throw new AppError(
                    "Insufficient data.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const accessCodeRef = this.accessCodeCollection.doc();
            await this.firestore.runTransaction(async (tx: Transaction) => {
                const query = this.accessCodeCollection
                    .where("phone", "==", normalizedPhone)
                    .where("status", "==", "active")
                    .orderBy("sentAt", "desc")
                    .limit(1);
                const availableCodes = await tx.get(query);

                availableCodes.forEach((snapshot) => {
                    tx.update(snapshot.ref, {
                        status: "expired",
                        expiredAt: new Date(),
                    });
                });

                tx.set(accessCodeRef, {
                    userId: code.userId,
                    phone: normalizedPhone,
                    codeHash: code.codeHash,
                    attempts: code.attempts ?? 0,
                    maxAttempts: code.maxAttempts ?? 5,
                    status: code.status ?? "active",
                    sentAt: code.sentAt ?? new Date(),
                    expiresAt: code.expiresAt,
                    consumedAt: code.consumedAt ?? null,
                });
            });

            return accessCodeRef.id;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to create access code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getCodeById(accessCodeId: string): Promise<AccessCode | null> {
        try {
            const snapshot = await this.accessCodeCollection
                .doc(accessCodeId)
                .get();
            return snapshot.data() ?? null;
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get access code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getLatestActiveByPhone(
        phone: string
    ): Promise<{ id: string; data: AccessCode } | null> {
        try {
            const normalizedPhone = normalizePhone(phone);
            if (!normalizedPhone)
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            const snapshot = await this.accessCodeCollection
                .where("phone", "==", normalizedPhone)
                .where("status", "==", "active")
                .orderBy("sentAt", "desc")
                .limit(1)
                .get();

            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, data: doc.data()! };
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get latest active by phone",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getCodesByPhone(
        phone: string,
        opts?: { status?: AccessCodeStatus; limit?: number }
    ): Promise<Array<{ id: string; data: AccessCode }>> {
        try {
            const normalizedPhone = normalizePhone(phone);
            if (!normalizedPhone)
                throw new AppError(
                    "Invalid phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );

            let query: FirebaseFirestore.Query<AccessCode> =
                this.accessCodeCollection.where("phone", "==", normalizedPhone);
            if (opts?.status) query = query.where("status", "==", opts.status);
            query = query
                .orderBy("sentAt", "desc")
                .limit(opts?.limit ?? DEFAULT_LIMIT);

            const snapshot = await query.get();
            return snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get codes by phone",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async canSend(
        phone: string,
        cooldownMs: number
    ): Promise<{
        allowed: boolean;
        remainingTtlMs?: number;
        activeCodeId?: string;
    }> {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone)
            throw new AppError("Invalid phone.", 400, ERROR_CODE.VALIDATION);

        const snapshot = await this.getLatestActiveByPhone(normalizedPhone);

        if (!snapshot) return { allowed: true };
        const data = snapshot.data;

        const sentAtMs = new Date(data.sentAt).getTime();
        const now = Date.now();

        const expiresAtMs = data.expiresAt
            ? new Date(data.expiresAt).getTime()
            : 0;
        if (expiresAtMs && expiresAtMs <= now)
            return { allowed: true, activeCodeId: snapshot.id };

        const remainingTtlMs = sentAtMs + cooldownMs - now;

        return remainingTtlMs > 0
            ? { allowed: false, remainingTtlMs, activeCodeId: snapshot.id }
            : { allowed: true, activeCodeId: snapshot.id };
    }

    async consumeActiveCode(
        accessCodeId: string,
        consumedAt = new Date()
    ): Promise<boolean> {
        try {
            return await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    const accessCodeRef =
                        this.accessCodeCollection.doc(accessCodeId);

                    const snapshot = await tx.get(accessCodeRef);
                    if (!snapshot.exists) return false;

                    const cur = snapshot.data()!;
                    if (cur.status !== "active") return false;
                    tx.update(accessCodeRef, {
                        status: "consumed",
                        consumedAt,
                    });
                    return true;
                }
            );
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to consume code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async incrementAttempts(
        accessCodeId: string,
        by = 1
    ): Promise<number | null> {
        try {
            return await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    const accessCodeRef =
                        this.accessCodeCollection.doc(accessCodeId);
                    const snapshot = await tx.get(accessCodeRef);
                    if (!snapshot.exists) return null;
                    const cur = snapshot.data()!;
                    if (cur.status !== "active") return cur.attempts ?? 0;
                    const next = (cur.attempts ?? 0) + by;
                    tx.update(accessCodeRef, { attempts: next });
                    return next;
                }
            );
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to increment attempts.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async blockCode(accessCodeId: string): Promise<boolean> {
        try {
            return await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    const accessCodeRef =
                        this.accessCodeCollection.doc(accessCodeId);
                    const snapshot = await tx.get(accessCodeRef);
                    if (!snapshot.exists) return false;
                    const cur = snapshot.data()!;
                    if (
                        cur.status === "consumed" ||
                        cur.status === "blocked" ||
                        cur.status === "expired"
                    ) {
                        return true;
                    }

                    tx.update(accessCodeRef, {
                        status: "blocked",
                        blockedAt: new Date(),
                    });
                    return true;
                }
            );
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to block access code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async expireCode(accessCodeId: string): Promise<boolean> {
        try {
            return await this.firestore.runTransaction(
                async (tx: Transaction) => {
                    const accessCodeRef =
                        this.accessCodeCollection.doc(accessCodeId);
                    const snapshot = await tx.get(accessCodeRef);
                    if (!snapshot.exists) return false;

                    const cur = snapshot.data()!;
                    if (
                        cur.status === "expired" ||
                        cur.status === "consumed" ||
                        cur.status === "blocked"
                    ) {
                        return true;
                    }

                    tx.update(accessCodeRef, {
                        status: "expired",
                        expiredAt: new Date(),
                    });
                    return true;
                }
            );
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to expire access code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async deleteByCodeId(accessCodeId: string): Promise<boolean> {
        try {
            const accessCodeRef = this.accessCodeCollection.doc(accessCodeId);
            const snapshot = await accessCodeRef.get();
            if (!snapshot.exists) return false;
            await accessCodeRef.delete();
            return true;
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to delete access code.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
