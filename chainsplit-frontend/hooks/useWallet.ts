"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { chain } from "@/lib/wagmi-config";

/**
 * Return type for useWallet hook
 */
export interface UseWalletReturn {
    /** Connected wallet address */
    address: `0x${string}` | undefined;
    /** Whether a wallet is connected */
    isConnected: boolean;
    /** Whether wallet is currently connecting */
    isConnecting: boolean;
    /** Current chain ID */
    chainId: number | undefined;
    /** Expected chain based on config */
    expectedChain: typeof chain;
    /** Whether on the correct chain */
    isCorrectChain: boolean;
    /** Connect wallet function */
    connect: () => void;
    /** Disconnect wallet function */
    disconnect: () => void;
    /** Available connectors */
    connectors: ReturnType<typeof useConnect>["connectors"];
    /** Connect with specific connector */
    connectWith: ReturnType<typeof useConnect>["connect"];
}

/**
 * Hook for wallet connection state and actions.
 * Wraps wagmi hooks with a cleaner interface for ChainSplit.
 */
export function useWallet(): UseWalletReturn {
    const { address, isConnected, isConnecting } = useAccount();
    const chainId = useChainId();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const isCorrectChain = chainId === chain.id;

    // Default connect uses the first available connector (usually injected/MetaMask)
    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    return {
        address,
        isConnected,
        isConnecting,
        chainId,
        expectedChain: chain,
        isCorrectChain,
        connect: handleConnect,
        disconnect,
        connectors,
        connectWith: connect,
    };
}
