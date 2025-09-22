import type { Firestore } from "firebase-admin/firestore";
import { Lesson } from "../models/lesson.model";
import { Assignment } from "../models/assignment.model";
import { AppError, ERROR_CODE } from "../config/error";

export class LessonRepo {
    private firestore: Firestore;
    constructor(deps: { firestore: Firestore }) {
        this.firestore = deps.firestore;
    }

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
}
