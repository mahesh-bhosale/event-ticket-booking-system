export interface ApiResponse<T = null> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
