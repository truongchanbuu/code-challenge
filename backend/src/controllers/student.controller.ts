import { Request, Response, NextFunction } from "express";
import { StudentService } from "../services/student.service";
import { SortType } from "../types/db";
import { UserService } from "../services/user.service";
import { AppError, ERROR_CODE } from "../config/error";
import { UpdateStudentSchema } from "../models/student.schema";
import { getAuthUser } from "../middlewares/auth.middleware";

export class StudentController {
    private readonly studentService: StudentService;
    private readonly userService: UserService;

    constructor(deps: {
        studentService: StudentService;
        userService: UserService;
    }) {
        this.studentService = deps.studentService;
        this.userService = deps.userService;
    }

    async addStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, email, phoneNumber, instructor } = req.body;
            const student = await this.studentService.addStudent(
                email,
                phoneNumber,
                username,
                instructor
            );

            return res.status(201).json({
                ok: true,
                data: student,
            });
        } catch (e) {
            console.log(e);
            next(e);
        }
    }

    async getStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const authedUser = (res.locals as any).auth as
                | { role?: string; phoneNumber?: string }
                | undefined;

            const {
                query = "",
                page = "1",
                pageSize = "20",
                sort = "name_asc",
                cursor = null,
            } = req.query as Partial<{
                query: string;
                page: string;
                pageSize: string;
                sort: SortType | string;
                cursor: string | null;
            }>;

            const instructorPhone =
                authedUser?.role === "instructor" && authedUser?.phoneNumber;

            if (!instructorPhone) {
                throw new AppError(
                    "Missing instructor phone.",
                    400,
                    ERROR_CODE.VALIDATION
                );
            }

            const parsedPage =
                Number.isFinite(Number(page)) && Number(page) > 0
                    ? parseInt(String(page), 10)
                    : 1;

            const parsedPageSize =
                Number.isFinite(Number(pageSize)) && Number(pageSize) > 0
                    ? parseInt(String(pageSize), 10)
                    : 20;

            const allowedSort: ReadonlySet<string> = new Set([
                "username_asc",
                "username_desc",
                "createdAt_desc",
            ]);
            const safeSort: SortType = allowedSort.has(sort)
                ? (sort as SortType)
                : "username_asc";

            const result = await this.userService.listStudentsByInstructor({
                instructorPhone,
                query: String(query ?? ""),
                page: parsedPage,
                pageSize: parsedPageSize,
                sort: safeSort,
                cursor: (cursor as string) ?? null,
            });

            return res.status(200).json({ ok: true, data: result });
        } catch (e) {
            next(e);
        }
    }

    async updateStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const { phoneNumber } = req.params;

            const parsed = UpdateStudentSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    ok: false,
                    error: {
                        code: ERROR_CODE.VALIDATION,
                        message: "Invalid data.",
                        details: parsed.error.flatten(),
                    },
                });
            }

            const student = await this.studentService.updateStudent(
                phoneNumber,
                parsed.data
            );

            return res.status(200).json({ ok: true, data: student });
        } catch (e) {
            next(e);
        }
    }

    async deleteStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const { phoneNumber } = req.params;
            const currentUser = getAuthUser(req, res);

            await this.studentService.deleteStudent(phoneNumber, currentUser);
            return res.status(200).json({ ok: true });
        } catch (e) {
            next(e);
        }
    }
}
