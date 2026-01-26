import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment configuration schema with validation
 */
const envSchema = z.object({
    // Server
    PORT: z.string().default("3001").transform(Number),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // CORS
    CORS_ORIGINS: z.string().default("http://localhost:3000"),

    // Pinata
    PINATA_API_KEY: z.string().optional(),
    PINATA_API_SECRET: z.string().optional(),
    PINATA_JWT: z.string().optional(),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.string().default("60000").transform(Number),
    RATE_LIMIT_MAX_REQUESTS: z.string().default("10").transform(Number),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error("❌ Invalid environment variables:");
        console.error(result.error.format());
        throw new Error("Invalid environment configuration");
    }

    return result.data;
}

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
