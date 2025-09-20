import { Request, Response, NextFunction } from "express";
import { StudentService } from "../services/student.service";

export class StudentController {
    private readonly studentService: StudentService;
    constructor(deps: { studentService: StudentService }) {
        this.studentService = deps.studentService;
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
            next(e);
        }
    }
}
