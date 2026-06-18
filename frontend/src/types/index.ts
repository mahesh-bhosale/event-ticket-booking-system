// ─────────────────────────────────────────────────────────────
//  Shared Frontend Types
// ─────────────────────────────────────────────────────────────

/**
 * Standard API response envelope matching the backend's ApiResponse class.
 */
export interface ApiResponse<T = null> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: string[];
  meta?: PaginationMeta;
}

/**
 * Pagination metadata returned by list endpoints.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic async state for data fetching.
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * JWT payload shape decoded on the frontend.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Minimal authenticated user stored in context.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}
