import { targetChain } from "@/lib/wagmi-config";

/**
 * Build a block-explorer URL from the active chain's metadata.
 *
 * wagmi chain objects carry `blockExplorers.default.url`, but for local
 * Foundry/Anvil chains there is no explorer — we fall back to Etherscan
 * mainnet (better than a broken link and visually signals "wrong chain").
 */
const FALLBACK_EXPLORER = "https://etherscan.io";

function baseUrl(): string {
    return targetChain.blockExplorers?.default?.url ?? FALLBACK_EXPLORER;
}

/** Explorer link for a wallet / contract address */
export function explorerAddressUrl(address: string): string {
    return `${baseUrl()}/address/${address}`;
}

/** Explorer link for a transaction hash */
export function explorerTxUrl(txHash: string): string {
    return `${baseUrl()}/tx/${txHash}`;
}
