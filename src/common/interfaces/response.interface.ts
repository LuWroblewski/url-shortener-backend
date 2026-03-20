export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  request_date: string;
  path: string;
  data: T;
}
