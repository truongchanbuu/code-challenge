import type { Firestore } from "firebase-admin/firestore";
import { Assignment } from "../models/assignment.model";
import { AppError, ERROR_CODE } from "../config/error";
import { normalizePhone } from "../utils/phone";
import { toDate } from "../utils/date";

const BATCH_LIMIT = 500;

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export class StudentLessonRepo {
    private readonly firestore: Firestore;
    private readonly ROOT = "studentLessons";
    private readonly SUB = "lessons";

    constructor({ firestore }: { firestore: Firestore }) {
        this.firestore = firestore;
    }

    private collection(phone: string) {
        return this.firestore
            .collection(this.ROOT)
            .doc(phone)
            .collection(this.SUB);
    }

    async listForStudent(phone: string): Promise<Assignment[]> {
        const snapshot = await this.collection(phone)
            .orderBy("assignedAt", "desc")
            .limit(200)
            .get();
        return snapshot.docs.map((d) => d.data() as Assignment);
    }

    async saveAssignmentsForStudents(
        studentPhones: string[],
        assignment: Assignment
    ): Promise<void> {
        try {
            for (const phonesChunk of chunk(studentPhones, BATCH_LIMIT)) {
                const batch = this.firestore.batch();
                phonesChunk.forEach((phone) => {
                    const ref = this.collection(phone).doc(assignment.lessonId);

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

    async getLatestAssignmentsForStudents(phones: string[]) {
        const out: any = {};
        await Promise.all(
            phones.map(async (phone) => {
                try {
                    const snapshot = await this.collection(phone)
                        .orderBy("assignedAt", "desc")
                        .limit(1)
                        .get();

                    if (snapshot.empty) {
                        out[phone] = null;
                        return;
                    }

                    const doc = snapshot.docs[0];
                    const data = doc.data();
                    out[phone] = {
                        lessonId: data.lessonId,
                        title: data.title,
                        description: data.description ?? "",
                        status: data.status,
                        assignedBy: data.assignedBy,
                        assignedAt: toDate(data.assignedAt)!,
                        doneAt: toDate(data.doneAt),
                        updatedAt: toDate(data.updatedAt),
                    };
                } catch {
                    (out as any)[phone] = null;
                }
            })
        );

        return out;
    }

    async getOne(phone: string, lessonId: string): Promise<Assignment | null> {
        const doc = await this.collection(phone).doc(lessonId).get();
        return doc.exists ? (doc.data() as Assignment) : null;
    }

    async markDone(phone: string, lessonId: string, when: Date): Promise<void> {
        const ref = this.collection(phone).doc(lessonId);
        await this.firestore.runTransaction(async (tx) => {
            const cur = await tx.get(ref);
            if (!cur.exists) throw new Error("NOT_FOUND");
            const data = cur.data() as Assignment;
            if (data.status === "done") {
                tx.update(ref, { updatedAt: when });
            } else {
                tx.update(ref, {
                    status: "done",
                    doneAt: when,
                    updatedAt: when,
                });
            }
        });
    }
}
