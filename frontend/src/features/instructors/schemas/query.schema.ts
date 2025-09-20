export type StudentsQuery = {
  query: string;
  page: number;
  pageSize: number;
  sort?: "name.asc" | "name.desc";
};
