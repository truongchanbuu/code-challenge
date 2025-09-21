import type { LessonRepo } from "../repos/lesson.repo";
import { normalizePhone } from "../utils/phone";
import { AppError, ERROR_CODE } from "../config/error";
import type { SocketServer } from "../libs/socket";
import { AssignLessonInput } from "../types/lesson";

function genLessonId() {
    return `L_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export class LessonService {
    private readonly lessonRepo: LessonRepo;
    private readonly socketServer?: SocketServer;

    constructor(deps: { lessonRepo: LessonRepo; socketServer?: SocketServer }) {
        this.lessonRepo = deps.lessonRepo;
        this.socketServer = deps.socketServer;
    }

    async assignLesson(
        callerPhoneRaw: string,
        body: AssignLessonInput
    ): Promise<{
        lessonId: string;
        assignedTo: number;
        skipped: number;
        skippedPhones: string[];
    }> {
        const caller = normalizePhone(callerPhoneRaw);
        if (!caller)
            throw new AppError(
                "Invalid caller phone.",
                400,
                ERROR_CODE.VALIDATION
            );

        const seen = new Set<string>();
        const normalized: string[] = [];
        const skippedPhones: string[] = [];
        for (const p of body.studentPhones) {
            const n = normalizePhone(p);
            if (!n) {
                skippedPhones.push(p);
                continue;
            }
            if (!seen.has(n)) {
                seen.add(n);
                normalized.push(n);
            }
        }
        if (normalized.length === 0) {
            throw new AppError(
                "No valid student phones.",
                404,
                ERROR_CODE.NOT_FOUND
            );
        }

        const usersMap = await this.lessonRepo.getUsersByPhones(normalized);
        const owned: string[] = [];
        for (const ph of normalized) {
            const u = usersMap[ph];
            if (u?.role === "student" && u.primaryInstructor === caller)
                owned.push(ph);
            else skippedPhones.push(ph);
        }
        if (owned.length === 0) {
            throw new AppError(
                "No owned students to assign.",
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
            createdBy: caller,
            createdAt: now,
        });

        await this.lessonRepo.saveAssignmentsForStudents(owned, {
            lessonId,
            title: body.title,
            description: body.description ?? "",
            status: "assigned",
            assignedBy: caller,
            assignedAt: now,
            doneAt: null,
            updatedAt: now,
        });

        if (this.socketServer) {
            this.socketServer.emitLessonAssigned(lessonId, body.title, owned);
            this.socketServer.emitToPhone(caller, "lesson:dispatched", {
                lessonId,
                assignedTo: owned.length,
                skipped: skippedPhones.length,
            });
        }

        return {
            lessonId,
            assignedTo: owned.length,
            skipped: skippedPhones.length,
            skippedPhones,
        };
    }
}
