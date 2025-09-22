import { Router } from "express";
import { InstructorController } from "../controllers/instructor.controller";

export class StudentRoutes {
    public router: Router;

    constructor({
        instructorController,
    }: {
        instructorController: InstructorController;
    }) {
        this.router = Router();
    }
}
