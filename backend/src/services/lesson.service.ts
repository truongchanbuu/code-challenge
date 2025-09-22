import type { LessonRepo } from "../repos/lesson.repo";
import { normalizePhone } from "../utils/phone";
import { AppError, ERROR_CODE } from "../config/error";
import type { SocketServer } from "../libs/socket";
import { AssignLessonInput } from "../types/lesson";
import { UserRepo } from "../repos/user.repo";
import { EmailNotifier } from "./email.service";
import { NotificationService } from "./notification.service";

function genLessonId() {
    return `L_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export class LessonService {
    private readonly lessonRepo: LessonRepo;
    private readonly userRepo: UserRepo;
    private readonly notificationService: NotificationService;

    constructor(deps: {
        lessonRepo: LessonRepo;
        userRepo: UserRepo;
        notificationService: NotificationService;
    }) {
        this.lessonRepo = deps.lessonRepo;
        this.userRepo = deps.userRepo;
        this.notificationService = deps.notificationService;
    }

    async assignLesson(
        callerId: string,
        body: AssignLessonInput
    ): Promise<{
        lessonId: string;
        assignedTo: number;
        skipped: number;
        skippedPhones: string[];
    }> {
        const startedAt = Date.now();
        const corrId = `assign:${startedAt.toString(36)}`;

        try {
            if (!callerId)
                throw new AppError(
                    "Invalid data.",
                    400,
                    ERROR_CODE.INVALID_DATA
                );
            const caller = await this.userRepo.getUserById(callerId);
            if (!caller)
                throw new AppError(
                    "Invalid data.",
                    400,
                    ERROR_CODE.INVALID_DATA
                );

            const callerPhone = normalizePhone(caller.phoneNumber);
            if (!callerPhone) {
                throw new AppError(
                    "Instructor phone is missing/invalid.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            const seen = new Set<string>();
            const phones: string[] = [];
            const skippedPhones: string[] = [];

            for (const raw of body.studentPhones ?? []) {
                const n = normalizePhone(raw);
                if (!n) {
                    skippedPhones.push(raw);
                    continue;
                }
                if (!seen.has(n)) {
                    seen.add(n);
                    phones.push(n);
                }
            }

            if (phones.length === 0) {
                throw new AppError(
                    "No valid student phones.",
                    404,
                    ERROR_CODE.NOT_FOUND
                );
            }

            const lessonId = genLessonId();
            const now = new Date();

            await this.lessonRepo.createLesson({
                lessonId,
                title: body.title,
                description: body.description ?? "",
                createdBy: callerPhone ?? caller.email ?? caller.username,
                createdAt: now,
            });

            await this.lessonRepo.saveAssignmentsForStudents(phones, {
                lessonId,
                title: body.title,
                description: body.description ?? "",
                status: "assigned",
                assignedBy: callerPhone,
                assignedAt: now,
                doneAt: null,
                updatedAt: now,
            });

            try {
                await this.notificationService.notifyLessonAssigned(
                    phones,
                    lessonId,
                    body.title,
                    body.description ?? "",
                    { sendEmail: true }
                );
            } catch (e: any) {
                console.log(corrId, "socket emit skipped", e?.message);
            }

            return {
                lessonId,
                assignedTo: phones.length,
                skipped: skippedPhones.length, // chỉ bao gồm những số invalid format
                skippedPhones,
            };
        } catch (e: any) {
            console.log(corrId, "assignLesson error", {
                message: e?.message,
                code: e?.code ?? e?.name,
            });
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Internal error while assigning lesson",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
