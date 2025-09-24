import type {
    Firestore,
    QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { AppError, ERROR_CODE } from "../config/error";
import type { Lesson } from "../models/lesson.model";

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

    async getLessonById(lessonId: string): Promise<Lesson | null> {
        try {
            const lessonRef = this.firestore
                .collection("lessons")
                .doc(lessonId);
            const snap = await lessonRef.get();
            if (!snap.exists) return null;
            return this.toLesson(snap);
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to get lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async updateLesson(
        lessonId: string,
        patch: Partial<Pick<Lesson, "title" | "description">>
    ): Promise<Lesson> {
        try {
            const lessonRef = this.firestore
                .collection("lessons")
                .doc(lessonId);
            const snap = await lessonRef.get();
            if (!snap.exists) {
                throw new AppError(
                    "Lesson not found.",
                    404,
                    ERROR_CODE.NOT_FOUND
                );
            }
            await lessonRef.set(
                {
                    ...patch,
                    updatedAt: new Date(),
                },
                { merge: true }
            );
            const after = await lessonRef.get();
            return this.toLesson(after);
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to update lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async deleteLesson(lessonId: string): Promise<void> {
        try {
            const lessonRef = this.firestore
                .collection("lessons")
                .doc(lessonId);
            await lessonRef.delete();
        } catch (e) {
            console.error(e);
            if (e instanceof AppError) throw e;
            throw new AppError(
                "Failed to delete lesson.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async listLessonsByInstructor(params: {
        createdBy: string;
        query?: string;
        pageSize?: number;
        cursor?: string | null;
    }): Promise<{ data: Lesson[]; nextCursor: string | null }> {
        const { createdBy, query } = params;
        let { pageSize = 20, cursor = null } = params;

        try {
            pageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

            const col = this.firestore.collection("lessons");
            let q = col
                .where("createdBy", "==", createdBy)
                .orderBy("createdAt", "desc")
                .orderBy("lessonId");

            if (cursor) {
                const cursorDoc = await col.doc(cursor).get();
                if (cursorDoc.exists) {
                    q = q.startAfter(cursorDoc);
                }
            }

            q = q.limit(pageSize);

            const snap = await q.get();
            const rows = snap.docs.map((d) => this.toLesson(d));

            let filtered = rows;
            const normalizedQuery = query?.trim().toLowerCase();
            if (normalizedQuery) {
                filtered = rows.filter((row) => {
                    const title = row.title?.toLowerCase() ?? "";
                    const desc = row.description?.toLowerCase() ?? "";
                    const id = row.lessonId?.toLowerCase() ?? "";
                    return (
                        title.includes(normalizedQuery) ||
                        desc.includes(normalizedQuery) ||
                        id.includes(normalizedQuery)
                    );
                });
            }

            const lastDoc = snap.docs[snap.docs.length - 1] || null;
            const nextCursor = lastDoc ? lastDoc.id : null;

            return { data: filtered, nextCursor };
        } catch (e: any) {
            console.error(e);
            if (e instanceof AppError) throw e;

            throw new AppError(
                "Failed to list lessons.",
                500,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    private toLesson(
        snap: QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot
    ): Lesson {
        const raw = snap.data() as any;

        const createdAt = raw?.createdAt?.toDate?.()
            ? raw.createdAt.toDate()
            : new Date(raw?.createdAt ?? Date.now());

        const updatedAt = raw?.updatedAt?.toDate?.()
            ? raw.updatedAt.toDate()
            : raw?.updatedAt
              ? new Date(raw.updatedAt)
              : undefined;

        const lesson: Lesson = {
            lessonId: raw.lessonId ?? snap.id,
            title: raw.title ?? "",
            description: raw.description ?? "",
            createdAt,
            createdBy: raw.createdBy,
            ...(updatedAt ? { updatedAt } : {}),
        };

        return lesson;
    }
}
