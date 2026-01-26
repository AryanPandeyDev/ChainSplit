import { Response } from "express";

/**
 * Standard API response structure
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown
): void {
    const response: ApiResponse<never> = {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
    res.status(statusCode).json(response);
}

/**
 * Common error codes
 */
export const ErrorCodes = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    RATE_LIMITED: "RATE_LIMITED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    UPLOAD_FAILED: "UPLOAD_FAILED",
    BAD_REQUEST: "BAD_REQUEST",
} as const;
