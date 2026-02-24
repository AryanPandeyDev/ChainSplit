"use client";

import { useReadContracts } from "wagmi";
import { groupDirectAbi, groupEscrowAbi, ExpenseState } from "@/lib/contracts";
import type { Address } from "viem";

/**
 * Decoded expense from contract
 */
export interface DecodedExpense {
    id: number;
    payer: Address;
    amount: bigint;
    ipfsCid: string;
    state: number;
    acceptedCount: bigint;
}

/**
 * Map numeric state to label
 */
export function expenseStateLabel(state: number): string {
    switch (state) {
        case ExpenseState.Created:
            return "pending";
        case ExpenseState.Settled:
            return "settled";
        case ExpenseState.Cancelled:
            return "cancelled";
        default:
            return "unknown";
    }
}

/**
 * Hook for reading all expenses from a group contract.
 * Uses multicall to batch `getExpense(i)` for i = 0..expenseCount-1.
 */
export function useGroupExpenses(
    groupAddress: Address | undefined,
    expenseCount: number,
    isEscrow: boolean = false
) {
    const abi = isEscrow ? groupEscrowAbi : groupDirectAbi;

    const contracts = Array.from({ length: expenseCount }, (_, i) => ({
        address: groupAddress!,
        abi,
        functionName: "getExpense" as const,
        args: [BigInt(i)] as const,
    }));

    const result = useReadContracts({
        contracts: expenseCount > 0 && groupAddress ? contracts : [],
        query: {
            enabled: !!groupAddress && expenseCount > 0,
        },
    });

    // Decode each result into a structured expense object
    const expenses: DecodedExpense[] = (result.data ?? [])
        .map((r, i) => {
            if (r.status !== "success" || !r.result) return null;
            const [payer, amount, ipfsCid, state, acceptedCount] = r.result as [
                Address,
                bigint,
                string,
                number,
                bigint,
            ];
            return { id: i, payer, amount, ipfsCid, state, acceptedCount };
        })
        .filter((e): e is DecodedExpense => e !== null);

    return {
        ...result,
        expenses,
    };
}
