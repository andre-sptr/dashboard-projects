import { NextResponse } from 'next/server';
import {
  AppError,
  formatErrorForResponse,
  formatErrorForLog,
  isOperationalError,
} from './errors';

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
};

/**
 * Create a successful API response
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response from a string message
 * @param error - Error message
 * @param status - HTTP status code (default: 500)
 */
export function errorResponse(error: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Create an error API response from an Error object
 * Handles custom AppError types and provides appropriate status codes
 * @param error - Error object
 */
export function handleError(error: Error | AppError): NextResponse {
  // Log the error
  const logData = formatErrorForLog(error);
  
  if (isOperationalError(error)) {
    // Expected errors - log as warning
    console.warn('[API Error]', logData);
  } else {
    // Unexpected errors - log as error
    console.error('[API Error]', logData);
  }

  // Format error for response
  const { message, statusCode, details } = formatErrorForResponse(error);

  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Wrap an async API handler with error handling
 * @param handler - Async function to wrap
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof Error) {
        return handleError(error);
      }
      // Handle non-Error objects
      return errorResponse('An unexpected error occurred', 500);
    }
  }) as T;
}
