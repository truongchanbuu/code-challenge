import { asValue, createContainer } from "awilix";
import { configs } from "./config";
import { admin } from "./config/firebase";

export function createConfigContainer() {
    const container = createContainer();

    const firebaseAdmin = admin;
    const auth = admin.auth();
    const firestore = admin.firestore();

    container.register({
        config: asValue(configs),
        firebaseAdmin: asValue(firebaseAdmin),
        firestore: asValue(firestore),
        auth: asValue(auth),
    });

    return container;
}
