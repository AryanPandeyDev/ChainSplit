import { Request, Response, NextFunction } from "express";
import { sendError, ErrorCodes, logger } from "../utils/index.js";

/**
 * Global error handler middleware
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    logger.error(
        {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        },
        "Unhandled error"
    );

    sendError(
        res,
        ErrorCodes.INTERNAL_ERROR,
        "An unexpected error occurred",
        500
    );
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
    sendError(res, ErrorCodes.NOT_FOUND, `Route ${req.path} not found`, 404);
}
