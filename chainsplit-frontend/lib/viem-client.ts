import { createPublicClient, http } from "viem";
import { targetChain } from "./wagmi-config";

/**
 * Public viem client for read-only contract interactions.
 * Uses the same chain and RPC URL as wagmi config for consistency.
 */
export const publicClient = createPublicClient({
    chain: targetChain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
});
