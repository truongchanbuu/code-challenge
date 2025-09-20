import {
    CollectionReference,
    Firestore,
    Transaction,
} from "firebase-admin/firestore";
import { SetupToken, SetupTokenConverter } from "../models/setup-token.model";
import { AppError, ERROR_CODE } from "../config/error";

export class SetupTokenRepo {
    private firestore: Firestore;
    private setupTokenCollection: CollectionReference<SetupToken>;

    constructor({ firestore }: { firestore: Firestore }) {
        this.firestore = firestore;
        this.setupTokenCollection = this.firestore
            .collection("setup_tokens")
            .withConverter(SetupTokenConverter);
    }

    async create(token: SetupToken): Promise<string> {
        const ref = this.setupTokenCollection.doc();
        await ref.set(token);
        return ref.id;
    }

    async findByHash(
        tokenHash: string
    ): Promise<{ id: string; data: SetupToken } | null> {
        const snapshotshot = await this.setupTokenCollection
            .where("tokenHash", "==", tokenHash)
            .limit(1)
            .get();
        if (snapshotshot.empty) return null;
        const doc = snapshotshot.docs[0];
        return { id: doc.id, data: doc.data() };
    }

    async consumeByHash(
        tokenHash: string,
        now = new Date()
    ): Promise<SetupToken> {
        return await this.firestore.runTransaction(async (tx: Transaction) => {
            const snapshot = await tx.get(
                this.setupTokenCollection
                    .where("tokenHash", "==", tokenHash)
                    .limit(1)
            );
            if (snapshot.empty)
                throw new AppError(
                    "Invalid token.",
                    400,
                    ERROR_CODE.INVALID_DATA
                );

            const doc = snapshot.docs[0];
            const token = doc.data();

            if (token.status === "used")
                throw new AppError(
                    "Token already used.",
                    409,
                    ERROR_CODE.CODE_USED
                );

            if (token.expiresAt.getTime() <= now.getTime())
                throw new AppError(
                    "Token expired.",
                    410,
                    ERROR_CODE.CODE_EXPIRED
                );

            tx.update(doc.ref, { status: "used", usedAt: now });

            return token;
        });
    }
}
