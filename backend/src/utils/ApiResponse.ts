// ─────────────────────────────────────────────────────────────
//  ApiResponse — Consistent HTTP Response Envelope
// ─────────────────────────────────────────────────────────────

export interface ApiResponseBody<T = null> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: string[];
  meta?: ApiResponseMeta;
}

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export class ApiResponse<T = null> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;
  public readonly errors?: string[];
  public readonly meta?: ApiResponseMeta;

  constructor(
    statusCode: number,
    message: string,
    data: T,
    meta?: ApiResponseMeta,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode >= 200 && statusCode < 300;
    this.meta = meta;
  }

  // ── Convenience factories ─────────────────────────────────

  static ok<T>(message: string, data: T, meta?: ApiResponseMeta): ApiResponse<T> {
    return new ApiResponse<T>(200, message, data, meta);
  }

  static created<T>(message: string, data: T): ApiResponse<T> {
    return new ApiResponse<T>(201, message, data);
  }

  static noContent(): ApiResponse<null> {
    return new ApiResponse<null>(204, 'No Content', null);
  }

  toJSON(): ApiResponseBody<T> {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      ...(this.meta ? { meta: this.meta } : {}),
    };
  }
}
