import express from "express";
import cors from "cors";
import { env } from "./config/index.js";
import { logger } from "./utils/index.js";
import { errorHandler, notFoundHandler, apiRateLimiter } from "./middleware/index.js";
import { pinController, healthController } from "./controllers/index.js";

/**
 * ChainSplit Backend Server
 * API for IPFS uploads and other backend services
 */
const app = express();

// Parse CORS origins
const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());

// Middleware
app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(apiRateLimiter);

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Routes
app.use("/api/health", healthController);
app.use("/api/pin", pinController);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
    logger.info(
        {
            port: env.PORT,
            env: env.NODE_ENV,
            corsOrigins,
        },
        `🚀 ChainSplit Backend running on port ${env.PORT}`
    );
});
