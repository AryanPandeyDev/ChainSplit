"use client";

import { useReadContract } from "wagmi";
import { useGroupInfo, useGroupBalance, useTokenInfo } from "./useContracts";
import { useGroupMode } from "./useGroups";
import { groupEscrowAbi } from "@/lib/contracts/group-escrow";
import type { Address } from "viem";
import { formatUnits } from "viem";

/**
 * Shape returned by useGroupDetails — matches GroupCardProps
 */
export interface GroupDetails {
    address: string;
    name: string;
    mode: "direct" | "escrow";
    memberCount: number;
    expenseCount: number;
    balance: number;
    tokenSymbol: string;
    tokenAddress: Address | undefined;
    tokenDecimals: number;
    /** Escrow-only fields */
    groupState?: number;
    depositCount?: number;
}

/**
 * Composite hook that batch-reads all data needed for a dashboard group card.
 *
 * Combines:
 * - getGroupInfo() → name, token address, memberCount, expenseCount (direct)
 *                   → name, token address, state, memberCount, depositCount (escrow)
 * - getGroupMode() → direct/escrow
 * - balances(user) → user's net balance
 * - token symbol/decimals → for display
 * - expenseCount() → separate read for escrow (not in getGroupInfo)
 */
export function useGroupDetails(
    groupAddress: Address | undefined,
    userAddress: Address | undefined
): {
    details: GroupDetails | undefined;
    isLoading: boolean;
    error: Error | null;
} {
    const modeResult = useGroupMode(groupAddress);
    const isEscrow = modeResult.isEscrow;

    const infoResult = useGroupInfo(groupAddress, isEscrow);
    const balanceResult = useGroupBalance(groupAddress, userAddress, isEscrow);

    // Escrow getGroupInfo returns 5-tuple: [name, token, state, memberCount, depositCount]
    // Direct getGroupInfo returns 4-tuple: [name, token, memberCount, expenseCount]
    const groupInfoDirect = !isEscrow
        ? (infoResult.data as [string, Address, bigint, bigint] | undefined)
        : undefined;

    const groupInfoEscrow = isEscrow
        ? (infoResult.data as [string, Address, number, bigint, bigint] | undefined)
        : undefined;

    const tokenAddress = groupInfoDirect?.[1] ?? groupInfoEscrow?.[1];
    const tokenResult = useTokenInfo(tokenAddress);

    // Escrow: read expenseCount separately (not in getGroupInfo)
    const escrowExpenseCountResult = useReadContract({
        address: groupAddress,
        abi: groupEscrowAbi,
        functionName: "expenseCount",
        query: {
            enabled: !!groupAddress && isEscrow,
        },
    });

    const isLoading =
        modeResult.isLoading ||
        infoResult.isLoading ||
        balanceResult.isLoading ||
        tokenResult.isLoading ||
        (isEscrow && escrowExpenseCountResult.isLoading);

    const error =
        (modeResult.error as Error | null) ??
        (infoResult.error as Error | null) ??
        (balanceResult.error as Error | null) ??
        (tokenResult.error as Error | null);

    if (!groupAddress || modeResult.mode === undefined) {
        return { details: undefined, isLoading, error };
    }

    // Parse mode-specific data
    let name: string;
    let memberCount: number;
    let expenseCount: number;
    let groupState: number | undefined;
    let depositCount: number | undefined;

    if (isEscrow && groupInfoEscrow) {
        name = groupInfoEscrow[0];
        groupState = groupInfoEscrow[2];
        memberCount = Number(groupInfoEscrow[3]);
        depositCount = Number(groupInfoEscrow[4]);
        expenseCount = Number((escrowExpenseCountResult.data as bigint) ?? BigInt(0));
    } else if (!isEscrow && groupInfoDirect) {
        name = groupInfoDirect[0];
        memberCount = Number(groupInfoDirect[2]);
        expenseCount = Number(groupInfoDirect[3]);
    } else {
        return { details: undefined, isLoading, error };
    }

    const decimals = (tokenResult.decimals as number) ?? 18;
    const symbol = (tokenResult.symbol as string) ?? "TOKEN";

    // Balance is int256 for direct, uint256 for escrow
    const rawBalance = balanceResult.data as bigint | undefined;
    const balance = rawBalance ? Number(formatUnits(rawBalance, decimals)) : 0;

    const details: GroupDetails = {
        address: groupAddress,
        name,
        mode: isEscrow ? "escrow" : "direct",
        memberCount,
        expenseCount,
        balance,
        tokenSymbol: symbol,
        tokenAddress,
        tokenDecimals: decimals,
        groupState,
        depositCount,
    };

    return { details, isLoading, error };
}
