import { asClass, asValue, createContainer } from "awilix";
import { configs } from "./config";
import { admin } from "./config/firebase";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { AuthRoutes } from "./routes/auth.route";

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

        authService: asClass(AuthService).singleton(),

        authController: asClass(AuthController).scoped(),

        authRoutes: asClass(AuthRoutes).singleton(),
    });

    return container;
}
