import { asClass, asFunction, asValue, createContainer } from "awilix";
import { configs } from "./config";
import { admin } from "./config/firebase";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { AuthRoutes } from "./routes/auth.routes";
import { UserRepo } from "./repos/user.repo";
import { AccessCodeRepo } from "./repos/access-code.repo";
import { SmsNotifier } from "./services/sms.service";
import { createTwilioClient } from "./libs/twilio";
import { JwtService } from "./services/jwt.service";
import { AdminRoutes } from "./routes/admin.routes";
import { UserService } from "./services/user.service";
import { AdminController } from "./controllers/admin.controller";
import { EmailNotifier } from "./services/email.service";
import { InstructorController } from "./controllers/instructor.controller";
import { StudentRoutes } from "./routes/student.routes";
import { InstructorService } from "./services/instructor.service";
import { ApiRoutes } from "./routes/api.routes";
import { SetupTokenRepo } from "./repos/setup-token.repo";
import { PhoneIndexRepo } from "./repos/phone-index.repo";
import { LessonRepo } from "./repos/lesson.repo";
import { LessonService } from "./services/lesson.service";
import { LessonController } from "./controllers/lesson.controller";
import { InstructorRoutes } from "./routes/instructor.routes";
import { ISocketServer } from "./libs/socket";
import { NotificationRepo } from "./repos/notification.repo";
import { NotificationService } from "./services/notification.service";
import { NotificationController } from "./controllers/notification.controller";
import { NotificationRoutes } from "./routes/notification.routes";
import { StudentLessonRepo } from "./repos/student-lesson.repo";
import { StudentService } from "./services/student.service";
import { StudentController } from "./controllers/student.controller";
import { ProfileRoutes } from "./routes/profile.routes";
import { ProfileController } from "./controllers/profile.controller";
import { ProfileService } from "./services/profile.service";
import { ChatRepo } from "./repos/chat.repo";
import { ChatService } from "./services/chat.service";
import { ChatController } from "./controllers/chat.controller";
import { ChatRoutes } from "./routes/chat.routes";

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

        socketServer: asValue(new ISocketServer()),

        jwtService: asClass(JwtService).singleton(),
        smsService: asClass(SmsNotifier).singleton(),
        emailService: asClass(EmailNotifier).singleton(),

        phoneIndexRepo: asClass(PhoneIndexRepo).singleton(),
        userRepo: asClass(UserRepo).singleton(),
        setupTokenRepo: asClass(SetupTokenRepo).singleton(),
        accessCodeRepo: asClass(AccessCodeRepo).singleton(),
        lessonRepo: asClass(LessonRepo).singleton(),
        studentLessonRepo: asClass(StudentLessonRepo).singleton(),
        notificationRepo: asClass(NotificationRepo).singleton(),
        chatRepo: asClass(ChatRepo).singleton(),

        profileService: asClass(ProfileService).singleton(),
        userService: asClass(UserService).singleton(),
        authService: asClass(AuthService).singleton(),
        instructorService: asClass(InstructorService).singleton(),
        studentService: asClass(StudentService).singleton(),
        lessonService: asClass(LessonService).singleton(),
        notificationService: asClass(NotificationService).singleton(),
        chatService: asClass(ChatService).singleton(),

        authController: asClass(AuthController).singleton(),
        adminController: asClass(AdminController).singleton(),
        studentController: asClass(StudentController).singleton(),
        instructorController: asClass(InstructorController).singleton(),
        lessonController: asClass(LessonController).singleton(),
        notificationController: asClass(NotificationController).singleton(),
        profileController: asClass(ProfileController).singleton(),
        chatController: asClass(ChatController).singleton(),

        instructorRoutes: asClass(InstructorRoutes).singleton(),
        authRoutes: asClass(AuthRoutes).singleton(),
        adminRoutes: asClass(AdminRoutes).singleton(),
        studentRoutes: asClass(StudentRoutes).singleton(),
        notificationRoutes: asClass(NotificationRoutes).singleton(),
        profileRoutes: asClass(ProfileRoutes).singleton(),
        chatRoutes: asClass(ChatRoutes).singleton(),
        apiRoutes: asClass(ApiRoutes).singleton(),
    });

    return container;
}
