import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return NextResponse.json(responseBody, { status });
}

export function apiError(error: string, status = 400, details?: unknown) {
  const responseBody: ApiResponse = {
    success: false,
    error,
    details,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(responseBody, { status });
}