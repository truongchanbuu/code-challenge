export type StudentsQuery = {
  query: string;
  pageSize: number;
  sort?: "username_asc" | "username_desc" | "createdAt_desc";
};
