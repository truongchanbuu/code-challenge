import type { Firestore } from "firebase-admin/firestore";
import { Lesson } from "../models/lesson.model";
import { Assignment } from "../models/assignment.model";
import { AppError, ERROR_CODE } from "../config/error";

const BATCH_LIMIT = 500;

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export class LessonRepo {
    constructor(private firestore: Firestore) {}

    async createLesson(lesson: Lesson): Promise<void> {
        try {
            await this.firestore
                .collection("lessons")
                .doc(lesson.lessonId)
                .set(lesson, { merge: true });
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to create lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async saveAssignmentsForStudents(
        studentPhones: string[],
        assignment: Assignment
    ): Promise<void> {
        try {
            for (const phonesChunk of chunk(studentPhones, BATCH_LIMIT)) {
                const batch = this.firestore.batch();
                phonesChunk.forEach((phone) => {
                    const ref = this.firestore
                        .collection("studentLessons")
                        .doc(phone)
                        .collection("lessons")
                        .doc(assignment.lessonId);

                    batch.set(ref, assignment);
                });
                await batch.commit();
            }
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to assign lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async getUsersByPhones(
        phones: string[]
    ): Promise<
        Record<string, { role?: string; primaryInstructor?: string | null }>
    > {
        try {
            const IN_LIMIT = 10;
            const col = this.firestore.collection("users");
            const result: Record<
                string,
                { role?: string; primaryInstructor?: string | null }
            > = {};

            for (const slice of chunk(phones, IN_LIMIT)) {
                const snap = await col.where("phone", "in", slice).get();
                snap.forEach((doc) => {
                    const u = doc.data() as any;
                    result[u.phone] = {
                        role: u.role,
                        primaryInstructor: u.primaryInstructor ?? null,
                    };
                });
            }
            return result;
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get user.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }
}
