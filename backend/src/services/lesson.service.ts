import type { LessonRepo } from "../repos/lesson.repo";
import type { StudentLessonRepo } from "../repos/student-lesson.repo";
import type { UserRepo } from "../repos/user.repo";
import { NotificationService } from "./notification.service";

import { normalizePhone } from "../utils/phone";
import { AppError, ERROR_CODE } from "../config/error";

import {
    CreateLessonInput,
    UpdateLessonInput,
    ListLessonsQuery,
} from "../models/lesson.model";

function genLessonId() {
    return `L_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export class LessonService {
    private readonly lessonRepo: LessonRepo;
    private readonly studentLessonRepo: StudentLessonRepo;
    private readonly userRepo: UserRepo;
    private readonly notificationService: NotificationService;

    constructor(deps: {
        lessonRepo: LessonRepo;
        userRepo: UserRepo;
        notificationService: NotificationService;
        studentLessonRepo: StudentLessonRepo;
    }) {
        this.studentLessonRepo = deps.studentLessonRepo;
        this.lessonRepo = deps.lessonRepo;
        this.userRepo = deps.userRepo;
        this.notificationService = deps.notificationService;
    }

    private async getCallerPhoneOrThrow(callerId: string): Promise<string> {
        if (!callerId) {
            throw new AppError("Invalid data.", 400, ERROR_CODE.INVALID_DATA);
        }
        const caller = await this.userRepo.getUserById(callerId);
        if (!caller) {
            throw new AppError("User not found.", 404, ERROR_CODE.NOT_FOUND);
        }

        const phone = normalizePhone(caller.phoneNumber);
        if (!phone) {
            throw new AppError(
                "Instructor phone is missing/invalid.",
                400,
                ERROR_CODE.VALIDATION
            );
        }
        return phone;
    }

    private async ensureOwnershipOrThrow(
        callerPhone: string,
        lessonId: string
    ) {
        const lesson = await this.lessonRepo.getLessonById(lessonId);
        if (!lesson) {
            throw new AppError("Lesson not found.", 404, ERROR_CODE.NOT_FOUND);
        }
        if (lesson.createdBy !== callerPhone) {
            throw new AppError(
                "You are not allowed to modify this lesson.",
                403,
                ERROR_CODE.FORBIDDEN
            );
        }
        return lesson;
    }

    async createLesson(callerId: string, input: CreateLessonInput) {
        try {
            const callerPhone = await this.getCallerPhoneOrThrow(callerId);
            const now = new Date();
            const lessonId = genLessonId();

            await this.lessonRepo.createLesson({
                lessonId,
                title: input.title,
                description: input.description ?? "",
                createdBy: callerPhone,
                createdAt: now,
            });

            const created = await this.lessonRepo.getLessonById(lessonId);
            return created!;
        } catch (e: any) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to create lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async listLessons(callerId: string, q: ListLessonsQuery) {
        try {
            const callerPhone = await this.getCallerPhoneOrThrow(callerId);
            const { query, pageSize, cursor } = q;

            return await this.lessonRepo.listLessonsByInstructor({
                createdBy: callerPhone,
                query,
                pageSize,
                cursor: cursor ?? null,
            });
        } catch (e: any) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to list lessons.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getLesson(callerId: string, lessonId: string) {
        try {
            const callerPhone = await this.getCallerPhoneOrThrow(callerId);
            const lesson = await this.ensureOwnershipOrThrow(
                callerPhone,
                lessonId
            );
            return lesson;
        } catch (e: any) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async updateLesson(
        callerId: string,
        lessonId: string,
        patch: UpdateLessonInput
    ) {
        try {
            const callerPhone = await this.getCallerPhoneOrThrow(callerId);
            await this.ensureOwnershipOrThrow(callerPhone, lessonId);

            const updated = await this.lessonRepo.updateLesson(lessonId, {
                title: patch.title,
                description: patch.description,
            });

            return updated;
        } catch (e: any) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to update lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async deleteLesson(callerId: string, lessonId: string) {
        try {
            const callerPhone = await this.getCallerPhoneOrThrow(callerId);
            await this.ensureOwnershipOrThrow(callerPhone, lessonId);
            await this.lessonRepo.deleteLesson(lessonId);
            return { ok: true, lessonId };
        } catch (e: any) {
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to delete lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async assignLesson(
        callerId: string,
        body: {
            title: string;
            description?: string;
            studentPhones: string[];
        }
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

            await this.studentLessonRepo.saveAssignmentsForStudents(phones, {
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
                console.log(corrId, "socket/email notify skipped", e?.message);
            }

            return {
                lessonId,
                assignedTo: phones.length,
                skipped: skippedPhones.length,
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
