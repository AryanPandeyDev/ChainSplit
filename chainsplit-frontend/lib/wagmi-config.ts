import { http, webSocket, fallback, createConfig } from "wagmi";
import { mainnet, sepolia, foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * All chains the app supports. Wagmi needs transport definitions for each.
 * The order determines the default chain for unconnected state.
 */
const supportedChains = [foundry, sepolia, mainnet] as const;

/**
 * The chain this deployment targets — determined by NEXT_PUBLIC_CHAIN_ID.
 * Contract addresses in .env correspond to this chain.
 * Used to detect wallet/network mismatches and prompt switching.
 */
const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337", 10);
export const targetChain =
    supportedChains.find((c) => c.id === targetChainId) ?? foundry;

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8545";

/**
 * Wagmi configuration for ChainSplit.
 *
 * - Lists all supported chains so wagmi can match any wallet network
 * - Uses injected connector for browser wallets (MetaMask, Coinbase, etc.)
 * - WebSocket transport (with HTTP fallback) for real-time event subscriptions
 * - SSR enabled for Next.js App Router
 */
export const wagmiConfig = createConfig({
    chains: supportedChains,
    connectors: [injected()],
    transports: {
        [foundry.id]: fallback([webSocket(wsUrl), http(rpcUrl)]),
        [sepolia.id]: http(),
        [mainnet.id]: http(),
    },
    ssr: true,
});

