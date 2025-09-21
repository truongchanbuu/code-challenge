export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message: string;
  meta?: {
    nextCursor: string | null;
    pageSize: number;
    total: number;
  };
}
