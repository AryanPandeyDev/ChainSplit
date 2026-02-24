"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { factoryAbi, FACTORY_ADDRESS, GroupMode } from "@/lib/contracts";
import type { Address } from "viem";

/**
 * Hook for reading groups by user from Factory contract
 */
export function useUserGroups(userAddress: Address | undefined) {
    return useReadContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "getGroupsByUser",
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress && !!FACTORY_ADDRESS,
        },
    });
}

/**
 * Hook for reading group mode from Factory contract
 */
export function useGroupMode(groupAddress: Address | undefined) {
    const result = useReadContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "getGroupMode",
        args: groupAddress ? [groupAddress] : undefined,
        query: {
            enabled: !!groupAddress && !!FACTORY_ADDRESS,
        },
    });

    return {
        ...result,
        mode: result.data !== undefined ? (result.data as GroupMode) : undefined,
        isDirect: result.data === GroupMode.Direct,
        isEscrow: result.data === GroupMode.Escrow,
    };
}

/**
 * Hook for getting total group count
 */
export function useGroupCount() {
    return useReadContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "getGroupCount",
        query: {
            enabled: !!FACTORY_ADDRESS,
        },
    });
}

/**
 * Hook for getting paginated groups
 */
export function useGroupsPaginated(offset: bigint, limit: bigint) {
    return useReadContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "getGroupsPaginated",
        args: [offset, limit],
        query: {
            enabled: !!FACTORY_ADDRESS,
        },
    });
}

/**
 * Hook for creating a Direct mode group
 */
export function useCreateDirectGroup() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createGroup = (name: string, token: Address, members: Address[]) => {
        if (!FACTORY_ADDRESS) {
            throw new Error("Factory address not configured");
        }

        writeContract({
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: "createDirectGroup",
            args: [name, token, members],
        });
    };

    return {
        createGroup,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook for creating an Escrow mode group
 */
export function useCreateEscrowGroup() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createGroup = (
        name: string,
        token: Address,
        members: Address[],
        requiredDeposit: bigint,
        depositDeadline: bigint
    ) => {
        if (!FACTORY_ADDRESS) {
            throw new Error("Factory address not configured");
        }

        writeContract({
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: "createEscrowGroup",
            args: [name, token, members, requiredDeposit, depositDeadline],
        });
    };

    return {
        createGroup,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Combined hook for creating groups (either mode)
 * Provides a unified interface for the CreateGroupModal
 */
export function useCreateGroup() {
    const direct = useCreateDirectGroup();
    const escrow = useCreateEscrowGroup();

    const createDirectGroup = async (params: {
        name: string;
        members: Address[];
        tokenAddress: Address;
    }) => {
        direct.createGroup(params.name, params.tokenAddress, params.members);
    };

    const createEscrowGroup = async (params: {
        name: string;
        members: Address[];
        tokenAddress: Address;
        requiredDeposit: bigint;
        depositDeadline: bigint;
    }) => {
        escrow.createGroup(
            params.name,
            params.tokenAddress,
            params.members,
            params.requiredDeposit,
            params.depositDeadline
        );
    };

    return {
        createDirectGroup,
        createEscrowGroup,
        isLoading: direct.isPending || escrow.isPending || direct.isConfirming || escrow.isConfirming,
        isSuccess: direct.isSuccess || escrow.isSuccess,
        error: direct.error || escrow.error,
        hash: direct.hash || escrow.hash,
    };
}
