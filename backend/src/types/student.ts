import z from "zod";

export const GetStudentsQuerySchema = z
    .object({
        query: z.string().optional().default(""),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
        sort: z
            .enum(["username_asc", "username_desc", "createdAt_desc"])
            .default("username_asc"),
        cursor: z
            .string()
            .optional()
            .transform((v) => (v && v.trim() ? v : null))
            .nullable(),
    })
    .refine((d) => !d.cursor || d.page === 1, {
        path: ["cursor"],
        message:
            "Do not combine cursor with page > 1 when using cursor pagination.",
    });

export type GetStudentsQuery = z.infer<typeof GetStudentsQuerySchema>;
