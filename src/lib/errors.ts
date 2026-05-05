// Base application error with HTTP status codes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Validation error (400 Bad Request)
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message, 400);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Database error (500 Internal Server Error)
export class DatabaseError extends AppError {
  public readonly query?: string;

  constructor(message: string, query?: string) {
    super(message, 500);
    this.query = query;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// Not found error (404 Not Found)
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string = 'Resource not found', resource?: string) {
    super(message, 404);
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// Unauthorized error (401 Unauthorized)
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

// Forbidden error (403 Forbidden)
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

// Conflict error (409 Conflict)
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

// External service error (502 Bad Gateway)
export class ExternalServiceError extends AppError {
  public readonly service?: string;

  constructor(message: string, service?: string) {
    super(message, 502);
    this.service = service;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

// File processing error (422 Unprocessable Entity)
export class FileProcessingError extends AppError {
  public readonly filename?: string;

  constructor(message: string, filename?: string) {
    super(message, 422);
    this.filename = filename;
    Object.setPrototypeOf(this, FileProcessingError.prototype);
  }
}

// Check if error is operational (expected)
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// Get HTTP status code from error
export function getStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

// Format error for logging
export function formatErrorForLog(error: Error): Record<string, unknown> {
  const baseLog: Record<string, unknown> = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };

  if (error instanceof AppError) {
    baseLog.statusCode = error.statusCode;
    baseLog.isOperational = error.isOperational;
  }

  if (error instanceof ValidationError && error.errors) {
    baseLog.validationErrors = error.errors;
  }

  if (error instanceof DatabaseError && error.query) {
    baseLog.query = error.query;
  }

  if (error instanceof NotFoundError && error.resource) {
    baseLog.resource = error.resource;
  }

  if (error instanceof ExternalServiceError && error.service) {
    baseLog.service = error.service;
  }

  if (error instanceof FileProcessingError && error.filename) {
    baseLog.filename = error.filename;
  }

  return baseLog;
}

// Format error for API response
export function formatErrorForResponse(error: Error): {
  message: string;
  statusCode: number;
  details?: unknown;
} {
  const statusCode = getStatusCode(error);
  const message = error.message || 'An unexpected error occurred';

  const response: { message: string; statusCode: number; details?: unknown } = {
    message,
    statusCode,
  };

  if (error instanceof ValidationError && error.errors) {
    response.details = { errors: error.errors };
  }

  if (process.env.NODE_ENV === 'production') {
    if (statusCode >= 500) {
      response.message = 'Internal server error';
      delete response.details;
    }
  } else {
    response.details = {
      ...response.details,
      stack: error.stack,
    };
  }

  return response;
}
