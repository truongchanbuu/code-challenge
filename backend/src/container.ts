import { asClass, asFunction, asValue, createContainer } from "awilix";
import { configs } from "./config";
import { admin } from "./config/firebase";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { AuthRoutes } from "./routes/auth.route";
import { UserRepo } from "./repos/user.repo";
import { AccessCodeRepo } from "./repos/access-code.repo";
import { SmsNotifier } from "./services/sms.service";
import { createTwilioClient } from "./libs/twilio";
import { JwtService } from "./services/jwt.service";

export function createConfigContainer() {
    const container = createContainer();

    const firebaseAdmin = admin;
    const auth = admin.auth();
    const firestore = admin
        .firestore()
        .settings({ ignoreUndefinedProperties: true });

    container.register({
        config: asValue(configs),
        firebaseAdmin: asValue(firebaseAdmin),
        firestore: asValue(firestore),
        auth: asValue(auth),

        twilio: asFunction(createTwilioClient).singleton(),

        jwtService: asClass(JwtService).singleton(),
        smsService: asClass(SmsNotifier).singleton(),

        userRepo: asClass(UserRepo).singleton(),
        accessCodeRepo: asClass(AccessCodeRepo).singleton(),

        authService: asClass(AuthService).singleton(),

        authController: asClass(AuthController).scoped(),

        authRoutes: asClass(AuthRoutes).singleton(),
    });

    return container;
}
