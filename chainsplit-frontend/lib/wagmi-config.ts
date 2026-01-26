import { http, createConfig } from "wagmi";
import { mainnet, sepolia, foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Determines which chain to use based on environment configuration.
 * Defaults to local Foundry/Anvil for development.
 */
function getConfiguredChain() {
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337", 10);

    switch (chainId) {
        case 1:
            return mainnet;
        case 11155111:
            return sepolia;
        case 31337:
        default:
            return foundry;
    }
}

const chain = getConfiguredChain();

/**
 * Wagmi configuration for ChainSplit.
 * Uses injected connector for browser wallet extensions (MetaMask, Coinbase, etc.)
 */
export const wagmiConfig = createConfig({
    chains: [chain],
    connectors: [
        injected(),
    ],
    transports: {
        [chain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
    },
    ssr: true, // Enable SSR support for Next.js App Router
});

// Export chain for use in components
export { chain };
