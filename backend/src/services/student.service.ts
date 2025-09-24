import { UserRepo } from "../repos/user.repo";
import type { SocketServer } from "../libs/socket";
import { AppError, ERROR_CODE } from "../config/error";
import { StudentLessonRepo } from "../repos/student-lesson.repo";
import { toISO } from "../utils/date";

export class StudentService {
    private readonly studentLessonRepo: StudentLessonRepo;
    private readonly userRepo: UserRepo;
    private readonly socketServer?: SocketServer;

    constructor(deps: {
        studentLessonRepo: StudentLessonRepo;
        userRepo: UserRepo;
        socketServer?: SocketServer;
    }) {
        this.userRepo = deps.userRepo;
        this.studentLessonRepo = deps.studentLessonRepo;
        this.socketServer = deps.socketServer;
    }

    async myLessons(studentPhone: string) {
        const list = await this.studentLessonRepo.listForStudent(studentPhone);
        return list.map((assignment) => ({
            lessonId: assignment.lessonId,
            title: assignment.title,
            description: assignment.description,
            status: assignment.status,
            assignedBy: assignment.assignedBy,
            assignedAt: toISO(assignment.assignedAt)!,
            doneAt: assignment.doneAt ? toISO(assignment.doneAt) : null,
            updatedAt: toISO(assignment.updatedAt)!,
        }));
    }

    async markLessonDone(studentPhone: string, lessonId: string) {
        const cur = await this.studentLessonRepo.getOne(studentPhone, lessonId);
        if (!cur) {
            throw new AppError("Lesson not found", 404, ERROR_CODE.NOT_FOUND);
        }

        const now = new Date();
        await this.studentLessonRepo.markDone(studentPhone, lessonId, now);

        try {
            if (cur.assignedBy && this.socketServer) {
                this.socketServer.emitToPhone(cur.assignedBy, "lesson:done", {
                    studentPhone,
                    lessonId,
                    at: now.getTime(),
                });
            }
        } catch (e) {
            console.log(
                "[student] emit lesson:done failed:",
                (e as any)?.message
            );
        }

        return {
            lessonId,
            status: "done" as const,
            updatedAt: now.toISOString(),
        };
    }

    async editProfile(
        userId: string,
        input: { username?: string; email?: string }
    ) {
        const user = await this.userRepo.getUserById(userId);
        if (!user)
            throw new AppError("User not found", 404, ERROR_CODE.NOT_FOUND);

        const update: any = {};
        if (typeof input.username === "string")
            update.username = input.username.trim();
        if (typeof input.email === "string" && input.email.trim()) {
            update.email = input.email.trim();
            update.emailVerified = false;
        }

        if (Object.keys(update).length > 0) {
            await this.userRepo.updateUser(userId, update);
        }

        return {
            phone: user.phoneNumber,
            username: update.username ?? user.username ?? null,
            email: update.email ?? user.email ?? null,
            emailVerified: update.emailVerified ?? !!user.emailVerified,
        };
    }

    async me(userId: string) {
        const user = await this.userRepo.getUserById(userId);
        if (!user)
            throw new AppError("User not found", 404, ERROR_CODE.NOT_FOUND);
        return {
            phone: user.phoneNumber,
            username: user.username ?? null,
            email: user.email ?? null,
            role: user.role,
        };
    }
}
