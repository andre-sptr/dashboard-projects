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

// Create successful API response
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

// Create error API response from message
export function errorResponse(error: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

// Create error API response from Error object
export function handleError(error: Error | AppError): NextResponse {
  const logData = formatErrorForLog(error);
  
  if (isOperationalError(error)) {
    console.warn('[API Error]', logData);
  } else {
    console.error('[API Error]', logData);
  }

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

// Wrap async API handler with error handling
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
      return errorResponse('An unexpected error occurred', 500);
    }
  }) as T;
}
