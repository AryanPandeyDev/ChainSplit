import { Router, Request, Response } from "express";
import { z } from "zod";
import { pinataService } from "../services/index.js";
import { sendSuccess, sendError, ErrorCodes, logger } from "../utils/index.js";
import { uploadRateLimiter } from "../middleware/index.js";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        // Only allow images
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

/**
 * Request validation schema for JSON pin
 */
const pinJsonSchema = z.object({
    data: z.record(z.unknown()),
    name: z.string().min(1).max(100),
});

/**
 * Pin Controller
 * Handles IPFS upload requests via Pinata
 */
export const pinController = Router();

/**
 * POST /api/pin/file
 * Upload a file to IPFS
 */
pinController.post(
    "/file",
    uploadRateLimiter,
    upload.single("file"),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return sendError(res, ErrorCodes.BAD_REQUEST, "No file provided", 400);
            }

            if (!pinataService.isConfigured()) {
                logger.error("Pinata not configured - upload rejected");
                return sendError(
                    res,
                    ErrorCodes.INTERNAL_ERROR,
                    "IPFS upload service not configured",
                    503
                );
            }

            const result = await pinataService.pinFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            sendSuccess(res, {
                cid: result.cid,
                size: result.size,
                gateway: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${result.cid}`,
            });
        } catch (error) {
            logger.error({ error }, "File upload failed");
            sendError(
                res,
                ErrorCodes.UPLOAD_FAILED,
                "Failed to upload file to IPFS",
                500
            );
        }
    }
);

/**
 * POST /api/pin/json
 * Upload JSON data to IPFS
 */
pinController.post(
    "/json",
    uploadRateLimiter,
    async (req: Request, res: Response) => {
        try {
            const validation = pinJsonSchema.safeParse(req.body);

            if (!validation.success) {
                return sendError(
                    res,
                    ErrorCodes.VALIDATION_ERROR,
                    "Invalid request body",
                    400,
                    validation.error.format()
                );
            }

            if (!pinataService.isConfigured()) {
                return sendError(
                    res,
                    ErrorCodes.INTERNAL_ERROR,
                    "IPFS upload service not configured",
                    503
                );
            }

            const { data, name } = validation.data;
            const result = await pinataService.pinJSON(data, name);

            sendSuccess(res, {
                cid: result.cid,
                gateway: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${result.cid}`,
            });
        } catch (error) {
            logger.error({ error }, "JSON upload failed");
            sendError(
                res,
                ErrorCodes.UPLOAD_FAILED,
                "Failed to upload JSON to IPFS",
                500
            );
        }
    }
);

/**
 * GET /api/pin/status
 * Check Pinata connection status
 */
pinController.get("/status", async (req: Request, res: Response) => {
    const configured = pinataService.isConfigured();
    const connected = configured ? await pinataService.testConnection() : false;

    sendSuccess(res, {
        configured,
        connected,
    });
});
