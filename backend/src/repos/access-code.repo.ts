import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { AccessCode, AccessCodeConverter } from "../models/access-code.model";
import { normalizePhone } from "../utils/phone";
import { DatabaseError, ERROR_CODE } from "../config/error";

export class AccessCodeRepo {
    private firestore: Firestore;
    private accessCodeCollection: CollectionReference<AccessCode>;

    constructor({ firestore }: { firestore: any }) {
        this.firestore = firestore;
        this.accessCodeCollection = this.firestore
            .collection("accessCodes")
            .withConverter(AccessCodeConverter);
    }

    async saveAccessCode(code: AccessCode) {
        const normalizedPhone = normalizePhone(code.phone);
        if (!normalizedPhone)
            throw new DatabaseError(
                "Insufficient data.",
                ERROR_CODE.VALIDATION
            );

        const availableCodes = await this.accessCodeCollection
            .where("phone", "==", normalizedPhone)
            .where("status", "==", "active")
            .get();

        if (!availableCodes.empty) {
            availableCodes.docs.map((code) => {});
        }

        const accessCodeRef = this.accessCodeCollection.doc();
        await accessCodeRef.set({
            userId: code.userId,
            phone: normalizedPhone,
            codeHash: code.codeHash,
            attempts: code.attempts ?? 0,
            maxAttempts: code.maxAttempts ?? 5,
            status: code.status ?? "active",
            sentAt: code.sentAt,
            expiresAt: code.expiresAt,
            consumedAt: code.consumedAt ?? null,
        });
    }

    getAccessCodeByPhone(phone: string) {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone)
            throw new DatabaseError("Invalid phone.", ERROR_CODE.VALIDATION);
    }
}
