"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { groupDirectAbi, groupEscrowAbi, erc20Abi } from "@/lib/contracts";
import type { Address } from "viem";

// ============================================================================
// GROUP INFO HOOKS
// ============================================================================

/**
 * Hook for reading group info (works for both Direct and Escrow)
 */
export function useGroupInfo(groupAddress: Address | undefined, isEscrow: boolean = false) {
    return useReadContract({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        functionName: "getGroupInfo",
        query: {
            enabled: !!groupAddress,
        },
    });
}

/**
 * Hook for reading member balance in a group
 * Note: Direct mode returns int256 (can be negative), Escrow returns uint256
 */
export function useGroupBalance(
    groupAddress: Address | undefined,
    memberAddress: Address | undefined,
    isEscrow: boolean = false
) {
    return useReadContract({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        functionName: "balances",
        args: memberAddress ? [memberAddress] : undefined,
        query: {
            enabled: !!groupAddress && !!memberAddress,
        },
    });
}

/**
 * Hook for reading withdrawable balance (Direct mode only)
 */
export function useWithdrawableBalance(
    groupAddress: Address | undefined,
    memberAddress: Address | undefined
) {
    return useReadContract({
        address: groupAddress,
        abi: groupDirectAbi,
        functionName: "withdrawableBalance",
        args: memberAddress ? [memberAddress] : undefined,
        query: {
            enabled: !!groupAddress && !!memberAddress,
        },
    });
}

// ============================================================================
// EXPENSE HOOKS
// ============================================================================

/**
 * Hook for reading expense details
 */
export function useExpense(
    groupAddress: Address | undefined,
    expenseId: bigint | undefined,
    isEscrow: boolean = false
) {
    return useReadContract({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        functionName: "getExpense",
        args: expenseId !== undefined ? [expenseId] : undefined,
        query: {
            enabled: !!groupAddress && expenseId !== undefined,
        },
    });
}

/**
 * Hook for reading expense participants and their shares
 */
export function useExpenseParticipants(
    groupAddress: Address | undefined,
    expenseId: bigint | undefined,
    isEscrow: boolean = false
) {
    return useReadContract({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        functionName: "getExpenseParticipants",
        args: expenseId !== undefined ? [expenseId] : undefined,
        query: {
            enabled: !!groupAddress && expenseId !== undefined,
        },
    });
}

/**
 * Hook for creating an expense
 */
export function useCreateExpense(groupAddress: Address | undefined, isEscrow: boolean = false) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createExpense = (
        amount: bigint,
        participants: Address[],
        shares: bigint[],
        ipfsCid: string
    ) => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
            functionName: "createExpense",
            args: [amount, participants, shares, ipfsCid],
        });
    };

    return {
        createExpense,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook for accepting an expense
 */
export function useAcceptExpense(groupAddress: Address | undefined, isEscrow: boolean = false) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const acceptExpense = (expenseId: bigint) => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
            functionName: "acceptExpense",
            args: [expenseId],
        });
    };

    return {
        acceptExpense,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook for settling an expense (Direct mode only)
 */
export function useSettleExpense(groupAddress: Address | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const settleExpense = (expenseId: bigint) => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: groupDirectAbi,
            functionName: "settleExpense",
            args: [expenseId],
        });
    };

    return {
        settleExpense,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook for cancelling an expense (Direct mode only)
 */
export function useCancelExpense(groupAddress: Address | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const cancelExpense = (expenseId: bigint) => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: groupDirectAbi,
            functionName: "cancelExpense",
            args: [expenseId],
        });
    };

    return {
        cancelExpense,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// ============================================================================
// WITHDRAWAL HOOKS
// ============================================================================

/**
 * Hook for withdrawing funds from a group
 */
export function useWithdraw(groupAddress: Address | undefined, isEscrow: boolean = false) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const withdraw = () => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
            functionName: "withdraw",
        });
    };

    return {
        withdraw,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// ============================================================================
// ESCROW-SPECIFIC HOOKS
// ============================================================================

/**
 * Hook for reading deposit status (Escrow mode)
 */
export function useHasDeposited(groupAddress: Address | undefined, memberAddress: Address | undefined) {
    return useReadContract({
        address: groupAddress,
        abi: groupEscrowAbi,
        functionName: "hasDeposited",
        args: memberAddress ? [memberAddress] : undefined,
        query: {
            enabled: !!groupAddress && !!memberAddress,
        },
    });
}

/**
 * Hook for reading group state (Escrow mode)
 */
export function useGroupState(groupAddress: Address | undefined) {
    return useReadContract({
        address: groupAddress,
        abi: groupEscrowAbi,
        functionName: "state",
        query: {
            enabled: !!groupAddress,
        },
    });
}

/**
 * Hook for depositing to escrow group
 */
export function useDeposit(groupAddress: Address | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const deposit = () => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: groupEscrowAbi,
            functionName: "deposit",
        });
    };

    return {
        deposit,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook for proposing group close (Escrow mode)
 */
export function useProposeClose(groupAddress: Address | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const proposeClose = () => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: groupEscrowAbi,
            functionName: "proposeClose",
        });
    };

    return {
        proposeClose,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook for voting to close (Escrow mode)
 */
export function useVoteClose(groupAddress: Address | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const voteClose = () => {
        if (!groupAddress) {
            throw new Error("Group address not provided");
        }

        writeContract({
            address: groupAddress,
            abi: groupEscrowAbi,
            functionName: "voteClose",
        });
    };

    return {
        voteClose,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// ============================================================================
// ERC20 TOKEN HOOKS
// ============================================================================

/**
 * Hook for reading token balance
 */
export function useTokenBalance(tokenAddress: Address | undefined, accountAddress: Address | undefined) {
    return useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: accountAddress ? [accountAddress] : undefined,
        query: {
            enabled: !!tokenAddress && !!accountAddress,
        },
    });
}

/**
 * Hook for reading token allowance
 */
export function useTokenAllowance(
    tokenAddress: Address | undefined,
    ownerAddress: Address | undefined,
    spenderAddress: Address | undefined
) {
    return useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
        query: {
            enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress,
        },
    });
}

/**
 * Hook for reading token info (symbol, decimals, name)
 */
export function useTokenInfo(tokenAddress: Address | undefined) {
    const symbol = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
        query: { enabled: !!tokenAddress },
    });

    const decimals = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
        query: { enabled: !!tokenAddress },
    });

    const name = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
        query: { enabled: !!tokenAddress },
    });

    return {
        symbol: symbol.data,
        decimals: decimals.data,
        name: name.data,
        isLoading: symbol.isLoading || decimals.isLoading || name.isLoading,
        error: symbol.error || decimals.error || name.error,
    };
}

/**
 * Hook for approving token spending
 */
export function useTokenApprove(tokenAddress: Address | undefined) {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const approve = (spender: Address, amount: bigint) => {
        if (!tokenAddress) {
            throw new Error("Token address not provided");
        }

        writeContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [spender, amount],
        });
    };

    return {
        approve,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}
