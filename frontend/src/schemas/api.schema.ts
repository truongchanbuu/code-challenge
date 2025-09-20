export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message: string;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
