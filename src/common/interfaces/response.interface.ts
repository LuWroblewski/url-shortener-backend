export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  request_date: string;
  path: string;
  totalPages?: number;
  page?: number;
  limit?: number;
  data: T;
}
