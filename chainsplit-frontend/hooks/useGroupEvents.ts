"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useWatchContractEvent } from "wagmi";
import type { Address } from "viem";
import { groupDirectAbi } from "@/lib/contracts/group-direct";
import { groupEscrowAbi } from "@/lib/contracts/group-escrow";

/**
 * Watches key contract events via WebSocket and invalidates
 * relevant query caches so the UI updates in real time.
 *
 * Covers:
 * - Expense lifecycle events (both modes)
 * - Direct-mode balance/withdrawal events
 * - Escrow-mode lifecycle events (deposits, close votes, group state changes)
 *
 * Usage: call once per group page with the group address.
 */
export function useGroupEvents(
    groupAddress: Address | undefined,
    isEscrow: boolean = false
) {
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["readContract"] });
    };

    // ========================================================================
    // Shared expense events (both modes)
    // ========================================================================

    useWatchContractEvent({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        eventName: "ExpenseCreated",
        onLogs: invalidateAll,
        enabled: !!groupAddress,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        eventName: "ExpenseAccepted",
        onLogs: invalidateAll,
        enabled: !!groupAddress,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        eventName: "ExpenseSettled",
        onLogs: invalidateAll,
        enabled: !!groupAddress,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        eventName: "ExpenseCancelled",
        onLogs: invalidateAll,
        enabled: !!groupAddress,
    });

    // ========================================================================
    // Direct-mode events
    // ========================================================================

    useWatchContractEvent({
        address: groupAddress,
        abi: groupDirectAbi,
        eventName: "Withdrawn",
        onLogs: invalidateAll,
        enabled: !!groupAddress && !isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupDirectAbi,
        eventName: "BalanceUpdated",
        onLogs: invalidateAll,
        enabled: !!groupAddress && !isEscrow,
    });

    // ========================================================================
    // Escrow-mode lifecycle events
    // ========================================================================

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "DepositReceived",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "GroupActivated",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "GroupCancelled",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "CloseProposed",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "CloseVoted",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "GroupClosed",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "Withdrawn",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });

    useWatchContractEvent({
        address: groupAddress,
        abi: groupEscrowAbi,
        eventName: "DepositRefunded",
        onLogs: invalidateAll,
        enabled: !!groupAddress && isEscrow,
    });
}
