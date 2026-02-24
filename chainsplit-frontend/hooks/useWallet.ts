"use client";

import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { targetChain } from "@/lib/wagmi-config";

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
    /** Wallet's actual chain ID (from MetaMask, not wagmi config) */
    chainId: number | undefined;
    /** The chain this deployment's contracts live on */
    targetChain: typeof targetChain;
    /** Whether the wallet is on the target chain */
    isCorrectChain: boolean;
    /** Whether connected but on the wrong network */
    isWrongChain: boolean;
    /** Connect wallet function */
    connect: () => void;
    /** Disconnect wallet function */
    disconnect: () => void;
    /** Switch to the target chain */
    switchToTargetChain: () => void;
    /** Available connectors */
    connectors: ReturnType<typeof useConnect>["connectors"];
    /** Connect with specific connector */
    connectWith: ReturnType<typeof useConnect>["connect"];
}

/**
 * Hook for wallet connection state and actions.
 *
 * Chain detection uses `account.chainId` (the wallet's actual connected chain)
 * rather than `useChainId()` (which returns wagmi's config default regardless
 * of what the wallet reports).
 *
 * When a chain mismatch is detected, prompts MetaMask to switch to the
 * target chain via `wallet_switchEthereumChain`.
 */
export function useWallet(): UseWalletReturn {
    const { address, isConnected, isConnecting, chainId } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

    const isCorrectChain = chainId === targetChain.id;
    const isWrongChain = isConnected && !isCorrectChain;

    // Prompt MetaMask to switch when connected on the wrong chain
    useEffect(() => {
        if (isWrongChain) {
            switchChain({ chainId: targetChain.id });
        }
    }, [isWrongChain, switchChain]);

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    const handleSwitchToTarget = () => {
        switchChain({ chainId: targetChain.id });
    };

    return {
        address,
        isConnected,
        isConnecting,
        chainId,
        targetChain,
        isCorrectChain,
        isWrongChain,
        connect: handleConnect,
        disconnect,
        switchToTargetChain: handleSwitchToTarget,
        connectors,
        connectWith: connect,
    };
}
