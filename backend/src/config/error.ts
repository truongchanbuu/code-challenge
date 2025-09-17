export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode = 500,
        public code: string = "INTERNAL_ERROR"
    ) {
        super(message);
    }
}
