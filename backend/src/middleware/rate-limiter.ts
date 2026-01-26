import rateLimit from "express-rate-limit";
import { env } from "../config/index.js";
import { sendError, ErrorCodes } from "../utils/index.js";

/**
 * Rate limiter for API endpoints
 * Configurable via environment variables
 */
export const apiRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        sendError(
            res,
            ErrorCodes.RATE_LIMITED,
            "Too many requests, please try again later",
            429
        );
    },
    keyGenerator: (req) => {
        // Use X-Forwarded-For if behind a proxy, otherwise use IP
        return (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
            req.ip ||
            "unknown";
    },
});

/**
 * Stricter rate limiter for upload endpoints
 */
export const uploadRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        sendError(
            res,
            ErrorCodes.RATE_LIMITED,
            "Upload rate limit exceeded, please wait before uploading again",
            429
        );
    },
});
