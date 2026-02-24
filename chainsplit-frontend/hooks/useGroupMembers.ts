"use client";

import { useReadContracts } from "wagmi";
import { groupDirectAbi, groupEscrowAbi } from "@/lib/contracts";
import type { Address } from "viem";

/**
 * Hook for reading all member addresses from a group contract.
 * Uses multicall to batch `members(i)` for i = 0..memberCount-1.
 */
export function useGroupMembers(
    groupAddress: Address | undefined,
    memberCount: number,
    isEscrow: boolean = false
) {
    const abi = isEscrow ? groupEscrowAbi : groupDirectAbi;

    // Build one contract read per member index
    const contracts = Array.from({ length: memberCount }, (_, i) => ({
        address: groupAddress!,
        abi,
        functionName: "members" as const,
        args: [BigInt(i)] as const,
    }));

    const result = useReadContracts({
        contracts: memberCount > 0 && groupAddress ? contracts : [],
        query: {
            enabled: !!groupAddress && memberCount > 0,
        },
    });

    // Extract successful member addresses
    const members: Address[] = (result.data ?? [])
        .filter((r) => r.status === "success")
        .map((r) => r.result as Address);

    return {
        ...result,
        members,
    };
}
