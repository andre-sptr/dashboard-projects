import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

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

export function errorResponse(error: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}
