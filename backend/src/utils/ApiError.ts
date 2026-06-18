// ─────────────────────────────────────────────────────────────
//  ApiError — Custom Operational Error Class
// ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: string[];

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    stack?: string,
  ) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ── Convenience factories ─────────────────────────────────

  static badRequest(message: string, errors: string[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static unprocessable(message: string, errors: string[] = []): ApiError {
    return new ApiError(422, message, errors);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }

  toJSON(): Record<string, unknown> {
    return {
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      isOperational: this.isOperational,
    };
  }
}
