import { Router, Request, Response } from "express";
import { sendSuccess } from "../utils/index.js";

/**
 * Health Controller
 * Basic health check endpoints
 */
export const healthController = Router();

/**
 * GET /api/health
 * Basic health check
 */
healthController.get("/", (req: Request, res: Response) => {
    sendSuccess(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
