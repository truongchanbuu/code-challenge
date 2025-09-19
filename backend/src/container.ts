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
import { AdminRoutes } from "./routes/admin.route";
import { UserService } from "./services/user.service";
import { AdminController } from "./controllers/admin.controller";
import { EmailNotifier } from "./services/email.service";

export function createConfigContainer() {
    const container = createContainer();

    const firebaseAdmin = admin;
    const auth = admin.auth();
    const firestore = admin.firestore();
    firestore.settings({ ignoreUndefinedProperties: true });

    container.register({
        config: asValue(configs),
        firebaseAdmin: asValue(firebaseAdmin),
        firestore: asValue(firestore),
        auth: asValue(auth),

        twilio: asFunction(createTwilioClient).singleton(),

        jwtService: asClass(JwtService).singleton(),
        smsService: asClass(SmsNotifier).singleton(),
        emailService: asClass(EmailNotifier).singleton(),

        userRepo: asClass(UserRepo).singleton(),
        accessCodeRepo: asClass(AccessCodeRepo).singleton(),

        userService: asClass(UserService).singleton(),
        authService: asClass(AuthService).singleton(),

        authController: asClass(AuthController).singleton(),
        adminController: asClass(AdminController).singleton(),

        authRoutes: asClass(AuthRoutes).singleton(),
        adminRoutes: asClass(AdminRoutes).singleton(),
    });

    return container;
}
