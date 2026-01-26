import { env } from "../config/index.js";
import { logger } from "../utils/index.js";

/**
 * Response from Pinata pin API
 */
interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

/**
 * Pinata service for IPFS file uploads
 */
export class PinataService {
    private readonly apiKey: string;
    private readonly apiSecret: string;
    private readonly baseUrl = "https://api.pinata.cloud";

    constructor() {
        if (!env.PINATA_API_KEY || !env.PINATA_API_SECRET) {
            logger.warn("Pinata credentials not configured");
        }
        this.apiKey = env.PINATA_API_KEY || "";
        this.apiSecret = env.PINATA_API_SECRET || "";
    }

    /**
     * Check if Pinata is configured
     */
    isConfigured(): boolean {
        return Boolean(this.apiKey && this.apiSecret);
    }

    /**
     * Pin a file to IPFS via Pinata
     */
    async pinFile(
        file: Buffer,
        filename: string,
        mimeType: string
    ): Promise<{ cid: string; size: number }> {
        if (!this.isConfigured()) {
            throw new Error("Pinata not configured - missing API credentials");
        }

        const formData = new FormData();
        const blob = new Blob([file], { type: mimeType });
        formData.append("file", blob, filename);

        // Add metadata
        const metadata = JSON.stringify({
            name: filename,
            keyvalues: {
                app: "chainsplit",
                uploadedAt: new Date().toISOString(),
            },
        });
        formData.append("pinataMetadata", metadata);

        // Pin options
        const options = JSON.stringify({
            cidVersion: 1,
        });
        formData.append("pinataOptions", options);

        logger.info({ filename, mimeType }, "Uploading file to Pinata");

        const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
            method: "POST",
            headers: {
                pinata_api_key: this.apiKey,
                pinata_secret_api_key: this.apiSecret,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error({ status: response.status, error }, "Pinata upload failed");
            throw new Error(`Pinata upload failed: ${response.status}`);
        }

        const data = (await response.json()) as PinataResponse;

        logger.info({ cid: data.IpfsHash, size: data.PinSize }, "File pinned successfully");

        return {
            cid: data.IpfsHash,
            size: data.PinSize,
        };
    }

    /**
     * Pin JSON data to IPFS
     */
    async pinJSON(
        data: Record<string, unknown>,
        name: string
    ): Promise<{ cid: string }> {
        if (!this.isConfigured()) {
            throw new Error("Pinata not configured - missing API credentials");
        }

        const body = {
            pinataContent: data,
            pinataMetadata: {
                name,
                keyvalues: {
                    app: "chainsplit",
                },
            },
            pinataOptions: {
                cidVersion: 1,
            },
        };

        const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                pinata_api_key: this.apiKey,
                pinata_secret_api_key: this.apiSecret,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error({ status: response.status, error }, "Pinata JSON upload failed");
            throw new Error(`Pinata JSON upload failed: ${response.status}`);
        }

        const result = (await response.json()) as PinataResponse;

        return { cid: result.IpfsHash };
    }

    /**
     * Test connection to Pinata
     */
    async testConnection(): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
                headers: {
                    pinata_api_key: this.apiKey,
                    pinata_secret_api_key: this.apiSecret,
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const pinataService = new PinataService();
