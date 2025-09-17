import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { AccessCode, AccessCodeConverter } from "../models/access-code.model";

export class AccessCodeRepo {
    private firestore: Firestore;
    private accessCodeCollection: CollectionReference<AccessCode>;

    constructor({ firestore }: { firestore: any }) {
        this.firestore = firestore;
        this.accessCodeCollection = this.firestore
            .collection("accessCodes")
            .withConverter(AccessCodeConverter);
    }
}
