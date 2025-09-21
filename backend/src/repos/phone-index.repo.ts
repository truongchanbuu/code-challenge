import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { PhoneIndex, PhoneIndexConverter } from "../models/phone-index.model";
import { AppError, ERROR_CODE } from "../config/error";
import { normalizePhone } from "../utils/phone";

export class PhoneIndexRepo {
    private firestore: Firestore;
    private phoneIndexCollection: CollectionReference<PhoneIndex>;

    constructor({ firestore }: { firestore: Firestore }) {
        this.firestore = firestore;
        this.phoneIndexCollection = this.firestore
            .collection("phone_index")
            .withConverter(PhoneIndexConverter);
    }

    async getUserIdByPhone(phoneNumber: string) {
        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            if (!normalizedPhone) {
                throw new AppError(
                    "Invalid Phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            const phoneSnapshot = await this.phoneIndexCollection
                .doc(normalizedPhone)
                .get();

            if (!phoneSnapshot.exists) {
                throw new AppError(
                    "Phone not found.",
                    404,
                    ERROR_CODE.VALIDATION
                );
            }

            return phoneSnapshot.data()?.userId;
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

    async deletePhoneIndex(phoneNumber: string) {
        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            if (!normalizedPhone) {
                throw new AppError(
                    "Invalid Phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }
            await this.phoneIndexCollection.doc(normalizedPhone).delete();
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to delete phone index.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
