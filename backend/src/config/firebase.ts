import firebaseAdmin from "firebase-admin";

export const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.applicationDefault(),
});
