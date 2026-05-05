/**
 * Custom error types for the application
 * Provides structured error handling with proper HTTP status codes
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error (400 Bad Request)
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message, 400);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Database error (500 Internal Server Error)
 * Used when database operations fail
 */
export class DatabaseError extends AppError {
  public readonly query?: string;

  constructor(message: string, query?: string) {
    super(message, 500);
    this.query = query;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Not found error (404 Not Found)
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string = 'Resource not found', resource?: string) {
    super(message, 404);
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error (401 Unauthorized)
 * Used when authentication is required but not provided
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error (403 Forbidden)
 * Used when user doesn't have permission to access a resource
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Conflict error (409 Conflict)
 * Used when there's a conflict with the current state (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * External service error (502 Bad Gateway)
 * Used when an external service fails
 */
export class ExternalServiceError extends AppError {
  public readonly service?: string;

  constructor(message: string, service?: string) {
    super(message, 502);
    this.service = service;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * File processing error (422 Unprocessable Entity)
 * Used when file upload or processing fails
 */
export class FileProcessingError extends AppError {
  public readonly filename?: string;

  constructor(message: string, filename?: string) {
    super(message, 422);
    this.filename = filename;
    Object.setPrototypeOf(this, FileProcessingError.prototype);
  }
}

/**
 * Check if an error is an operational error (expected error that we can handle)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Format error for logging
 */
export function formatErrorForLog(error: Error): Record<string, any> {
  const baseLog: Record<string, any> = {
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

/**
 * Format error for API response
 */
export function formatErrorForResponse(error: Error): {
  message: string;
  statusCode: number;
  details?: any;
} {
  const statusCode = getStatusCode(error);
  const message = error.message || 'An unexpected error occurred';

  const response: { message: string; statusCode: number; details?: any } = {
    message,
    statusCode,
  };

  // Add additional details for specific error types
  if (error instanceof ValidationError && error.errors) {
    response.details = { errors: error.errors };
  }

  // Don't expose internal details in production
  if (process.env.NODE_ENV === 'production') {
    // Only return generic message for 500 errors in production
    if (statusCode >= 500) {
      response.message = 'Internal server error';
      delete response.details;
    }
  } else {
    // In development, include stack trace
    response.details = {
      ...response.details,
      stack: error.stack,
    };
  }

  return response;
}
