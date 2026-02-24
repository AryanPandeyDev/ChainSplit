"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Plus,
    Users,
    Receipt,
    Wallet,
    Settings,
    Copy,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUnits } from "viem";
import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { groupDirectAbi } from "@/lib/contracts/group-direct";
import { groupEscrowAbi } from "@/lib/contracts/group-escrow";
import {
    useWallet,
    useGroupMode,
    useGroupInfo,
    useGroupBalance,
    useGroupMembers,
    useGroupExpenses,
    useTokenInfo,
    useHasDeposited,
    useWithdraw,
    useWithdrawableBalance,
    useExpenseParticipants,
    useAcceptExpense,
    useSettleExpense,
    useCancelExpense,
    useCancelExpenseEscrow,
    useTokenApprove,
    useGroupEvents,
    expenseStateLabel,
    // Escrow lifecycle
    useDeposit,
    useProposeClose,
    useVoteClose,
    useCancelGroup,
    useRefundDeposit,
    useCheckDeadline,
    useRequiredDeposit,
    useDepositDeadline,
    useCloseVote,
    useCloseProposed,
    useEscrowExpenseCount,
} from "@/hooks";
import { GroupState } from "@/lib/contracts/group-escrow";
import { explorerAddressUrl } from "@/lib/explorer";

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({
    groupAddress,
    memberCount,
    expenseCount,
    isEscrow,
    tokenDecimals,
    tokenSymbol,
    userAddress,
}: {
    groupAddress: Address;
    memberCount: number;
    expenseCount: number;
    isEscrow: boolean;
    tokenDecimals: number;
    tokenSymbol: string;
    userAddress: Address;
}) {
    const { members } = useGroupMembers(groupAddress, memberCount, isEscrow);
    const { expenses } = useGroupExpenses(groupAddress, expenseCount, isEscrow);
    const balanceResult = useGroupBalance(groupAddress, userAddress, isEscrow);

    const rawBalance = balanceResult.data as bigint | undefined;
    const userBalance = rawBalance ? Number(formatUnits(rawBalance, tokenDecimals)) : 0;

    const pendingCount = expenses.filter((e) => e.state === 0).length;
    const settledCount = expenses.filter((e) => e.state === 1).length;

    // Total settled amount
    const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(formatUnits(e.amount, tokenDecimals)),
        0
    );

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Total Expenses</p>
                    <p className="text-2xl font-semibold mt-1">
                        {totalExpenses.toFixed(2)} {tokenSymbol}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Your Balance</p>
                    <p
                        className={cn(
                            "text-2xl font-semibold mt-1",
                            userBalance >= 0 ? "text-[var(--cs-accent-green)]" : "text-[var(--cs-error)]"
                        )}
                    >
                        {userBalance >= 0 ? "+" : ""}
                        {userBalance.toFixed(2)} {tokenSymbol}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Pending</p>
                    <p className="text-2xl font-semibold mt-1">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Settled</p>
                    <p className="text-2xl font-semibold mt-1">{settledCount}</p>
                </div>
            </div>

            {/* Direct-mode Withdraw */}
            {!isEscrow && (
                <DirectWithdrawSection
                    groupAddress={groupAddress}
                    userAddress={userAddress}
                    tokenDecimals={tokenDecimals}
                    tokenSymbol={tokenSymbol}
                />
            )}

            {/* Members List */}
            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] overflow-hidden">
                <div className="p-4 border-b border-[var(--cs-border-light)]">
                    <h3 className="font-semibold">Members ({memberCount})</h3>
                </div>
                <div className="divide-y divide-[var(--cs-border-light)]">
                    {members.map((memberAddr) => (
                        <MemberRow
                            key={memberAddr}
                            memberAddress={memberAddr}
                            groupAddress={groupAddress}
                            isEscrow={isEscrow}
                            tokenDecimals={tokenDecimals}
                            tokenSymbol={tokenSymbol}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Individual member row — reads its own balance via hook
 */
function MemberRow({
    memberAddress,
    groupAddress,
    isEscrow,
    tokenDecimals,
    tokenSymbol,
}: {
    memberAddress: Address;
    groupAddress: Address;
    isEscrow: boolean;
    tokenDecimals: number;
    tokenSymbol: string;
}) {
    const { data } = useGroupBalance(groupAddress, memberAddress, isEscrow);
    const rawBalance = data as bigint | undefined;
    const balance = rawBalance ? Number(formatUnits(rawBalance, tokenDecimals)) : 0;

    const shortAddr = `${memberAddress.slice(0, 6)}...${memberAddress.slice(-4)}`;

    return (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--cs-bg-gray)] flex items-center justify-center">
                    <Users className="w-5 h-5 text-[var(--cs-text-secondary)]" />
                </div>
                <span className="font-mono text-sm">{shortAddr}</span>
            </div>
            <span
                className={cn(
                    "font-semibold",
                    balance >= 0 ? "text-[var(--cs-accent-green)]" : "text-[var(--cs-error)]"
                )}
            >
                {balance >= 0 ? "+" : ""}
                {balance.toFixed(2)} {tokenSymbol}
            </span>
        </div>
    );
}

// ============================================================================
// DIRECT WITHDRAW SECTION
// ============================================================================

function DirectWithdrawSection({
    groupAddress,
    userAddress,
    tokenDecimals,
    tokenSymbol,
}: {
    groupAddress: Address;
    userAddress: Address;
    tokenDecimals: number;
    tokenSymbol: string;
}) {
    const wbResult = useWithdrawableBalance(groupAddress, userAddress);
    const rawWb = wbResult.data as bigint | undefined;
    const withdrawable = rawWb ? Number(formatUnits(rawWb, tokenDecimals)) : 0;

    const {
        withdraw,
        isPending: wPending,
        isConfirming: wConfirming,
        isSuccess: wSuccess,
    } = useWithdraw(groupAddress, false);

    if (withdrawable <= 0 && !wSuccess) return null;

    return (
        <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Withdrawable Balance</h3>
                    <p className="text-lg text-[var(--cs-accent-green)] font-semibold mt-1">
                        {withdrawable.toFixed(2)} {tokenSymbol}
                    </p>
                </div>
                {!wSuccess ? (
                    <Button
                        onClick={() => withdraw()}
                        disabled={wPending || wConfirming}
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {(wPending || wConfirming) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Withdraw
                    </Button>
                ) : (
                    <Badge className="bg-[var(--cs-success)] text-white">Withdrawn ✓</Badge>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// EXPENSES TAB
// ============================================================================

function ExpenseCard({
    expense,
    groupAddress,
    isEscrow,
    tokenDecimals,
    tokenSymbol,
    tokenAddress,
    userAddress,
}: {
    expense: { id: number; payer: string; amount: bigint; ipfsCid: string; state: number; acceptedCount: bigint };
    groupAddress: Address;
    isEscrow: boolean;
    tokenDecimals: number;
    tokenSymbol: string;
    tokenAddress: Address | undefined;
    userAddress: Address;
}) {
    const [showAcceptModal, setShowAcceptModal] = useState(false);

    const stateLabel = expenseStateLabel(expense.state);
    const amount = Number(formatUnits(expense.amount, tokenDecimals));
    const shortPayer = `${expense.payer.slice(0, 6)}...${expense.payer.slice(-4)}`;
    const isPending = expense.state === 0;
    const isUserPayer = expense.payer.toLowerCase() === userAddress.toLowerCase();

    // Check on-chain if user has already accepted this expense
    const hasAcceptedResult = useReadContract({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        functionName: "hasAccepted",
        args: [BigInt(expense.id), userAddress],
        query: {
            enabled: isPending && !isUserPayer,
        },
    });
    const alreadyAccepted = (hasAcceptedResult.data as boolean) ?? false;

    // Read participants to find user's share
    const participantsResult = useExpenseParticipants(
        groupAddress,
        BigInt(expense.id),
        isEscrow
    );
    const participantsData = participantsResult.data as [string[], bigint[]] | undefined;

    // Find user's share
    let userShare = 0;
    if (participantsData) {
        const [addresses, shares] = participantsData;
        const idx = addresses.findIndex(
            (addr) => addr.toLowerCase() === userAddress.toLowerCase()
        );
        if (idx >= 0) {
            userShare = Number(formatUnits(shares[idx], tokenDecimals));
        }
    }

    const isParticipant = userShare > 0;

    // How many non-payer participants need to accept
    const requiredAcceptances = participantsData
        ? participantsData[0].filter(
            (addr) => addr.toLowerCase() !== expense.payer.toLowerCase()
        ).length
        : 0;

    // Accept expense hook
    const {
        acceptExpense,
        isPending: acceptPending,
        isConfirming: acceptConfirming,
        isSuccess: acceptSuccess,
        error: acceptError,
    } = useAcceptExpense(groupAddress, isEscrow);

    // Token approval hook
    const {
        approve,
        isPending: approvePending,
        isConfirming: approveConfirming,
        isSuccess: approveSuccess,
    } = useTokenApprove(tokenAddress);

    // Ref to prevent re-firing acceptExpense after it's already been triggered
    const hasTriggeredAccept = useRef(false);

    const handleAccept = async () => {
        if (!tokenAddress || !groupAddress) return;

        // Reset the guard so a fresh approve→accept cycle can run
        hasTriggeredAccept.current = false;

        // For Direct mode: approve token first, then accept
        const shareInUnits = participantsData
            ? (() => {
                const [addresses, shares] = participantsData;
                const idx = addresses.findIndex(
                    (addr) => addr.toLowerCase() === userAddress.toLowerCase()
                );
                return idx >= 0 ? shares[idx] : BigInt(0);
            })()
            : BigInt(0);

        approve(groupAddress, shareInUnits);
    };

    // After approval succeeds, trigger acceptExpense ONCE
    useEffect(() => {
        if (approveSuccess && !hasTriggeredAccept.current) {
            hasTriggeredAccept.current = true;
            acceptExpense(BigInt(expense.id));
        }
    }, [approveSuccess]);

    const isProcessing = approvePending || approveConfirming || acceptPending || acceptConfirming;

    // Settle expense hook (payer only)
    const {
        settleExpense,
        isPending: settlePending,
        isConfirming: settleConfirming,
        isSuccess: settleSuccess,
        error: settleError,
    } = useSettleExpense(groupAddress);

    // Cancel expense hook (payer only, pending) — mode-aware
    const cancelDirect = useCancelExpense(isEscrow ? undefined : groupAddress);
    const cancelEscrow = useCancelExpenseEscrow(isEscrow ? groupAddress : undefined);
    const cancelHook = isEscrow ? cancelEscrow : cancelDirect;
    const cancelExpenseFn = cancelHook.cancelExpense;
    const cancelPending = cancelHook.isPending;
    const cancelConfirming = cancelHook.isConfirming;
    const cancelSuccess = cancelHook.isSuccess;
    const cancelError = cancelHook.error;

    const allAccepted = requiredAcceptances > 0 && Number(expense.acceptedCount) >= requiredAcceptances;
    const canSettle = isPending && isUserPayer && allAccepted && !settleSuccess;
    const isSettling = settlePending || settleConfirming;
    const canCancel = isPending && isUserPayer && !cancelSuccess && !settleSuccess;
    const isCancelling = cancelPending || cancelConfirming;

    const handleSettle = () => {
        settleExpense(BigInt(expense.id));
    };

    const handleCancel = () => {
        cancelExpenseFn(BigInt(expense.id));
    };

    return (
        <Link href={`/groups/${groupAddress}/expense/${expense.id}`}>
            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-4 cursor-pointer hover:border-[var(--cs-card-dark)] transition-colors">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                                Expense #{expense.id}
                            </span>
                            <Badge
                                variant={stateLabel === "settled" ? "default" : "outline"}
                                className={cn(
                                    "text-xs",
                                    stateLabel === "settled"
                                        ? "bg-[var(--cs-success)] text-white"
                                        : stateLabel === "cancelled"
                                            ? "border-[var(--cs-error)] text-[var(--cs-error)]"
                                            : "border-[var(--cs-warning)] text-[var(--cs-warning)]"
                                )}
                            >
                                {stateLabel}
                            </Badge>
                            {(alreadyAccepted || acceptSuccess) && (
                                <Badge className="bg-[var(--cs-success)] text-white text-xs">
                                    Accepted by you ✓
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-[var(--cs-text-secondary)]">
                            Paid by {shortPayer}
                        </p>
                        {isPending && participantsData && (
                            <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                                Accepted: {Number(expense.acceptedCount)}/{requiredAcceptances} participants
                            </p>
                        )}
                        {isParticipant && isPending && (
                            <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                                Your share: {userShare.toFixed(2)} {tokenSymbol}
                            </p>
                        )}
                        {expense.ipfsCid && (
                            <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5 font-mono truncate max-w-xs">
                                IPFS: {expense.ipfsCid}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">
                            {amount.toFixed(2)} {tokenSymbol}
                        </span>
                        {isPending && isParticipant && !isUserPayer && !alreadyAccepted && !acceptSuccess && (
                            <Button
                                size="sm"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAccept(); }}
                                disabled={isProcessing}
                                className="rounded-full bg-[var(--cs-accent-green)] hover:bg-[var(--cs-accent-green-hover)] text-[var(--cs-text-primary)]"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Accept"
                                )}
                            </Button>
                        )}
                        {canSettle && (
                            <Button
                                size="sm"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSettle(); }}
                                disabled={isSettling}
                                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSettling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Settle"
                                )}
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}
                                disabled={isCancelling}
                                className="rounded-full border-[var(--cs-error)] text-[var(--cs-error)]"
                            >
                                {isCancelling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Cancel"
                                )}
                            </Button>
                        )}
                        {settleSuccess && (
                            <Badge className="bg-[var(--cs-success)] text-white text-xs">
                                Settled ✓
                            </Badge>
                        )}
                        {cancelSuccess && (
                            <Badge className="border-[var(--cs-error)] text-[var(--cs-error)] text-xs">
                                Cancelled ✓
                            </Badge>
                        )}
                    </div>
                </div>
                {(acceptError || settleError) && (
                    <p className="text-xs text-[var(--cs-error)] mt-2">
                        Error: {(acceptError || settleError)?.message?.slice(0, 100)}
                    </p>
                )}
            </div>
        </Link>
    );
}

function ExpensesTab({
    groupAddress,
    expenseCount,
    isEscrow,
    tokenDecimals,
    tokenSymbol,
    tokenAddress,
    userAddress,
}: {
    groupAddress: Address;
    expenseCount: number;
    isEscrow: boolean;
    tokenDecimals: number;
    tokenSymbol: string;
    tokenAddress: Address | undefined;
    userAddress: Address;
}) {
    const { expenses, isLoading } = useGroupExpenses(groupAddress, expenseCount, isEscrow);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">All Expenses ({expenseCount})</h3>
                <Link href={`/groups/${groupAddress}/expense/new`}>
                    <Button
                        size="sm"
                        className="rounded-full bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Expense
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--cs-text-secondary)]" />
                </div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-12 text-[var(--cs-text-secondary)]">
                    No expenses yet. Create your first one!
                </div>
            ) : (
                <div className="space-y-3">
                    {expenses.map((expense) => (
                        <ExpenseCard
                            key={expense.id}
                            expense={expense}
                            groupAddress={groupAddress}
                            isEscrow={isEscrow}
                            tokenDecimals={tokenDecimals}
                            tokenSymbol={tokenSymbol}
                            tokenAddress={tokenAddress}
                            userAddress={userAddress}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// DEPOSITS TAB (Escrow only)
// ============================================================================

function DepositsTab({
    groupAddress,
    memberCount,
    tokenDecimals,
    tokenSymbol,
}: {
    groupAddress: Address;
    memberCount: number;
    tokenDecimals: number;
    tokenSymbol: string;
}) {
    const { members } = useGroupMembers(groupAddress, memberCount, true);

    // Read required deposit from contract
    const requiredDepositResult = useGroupInfo(groupAddress, true);
    // Even though we don't get REQUIRED_DEPOSIT from getGroupInfo, we'll show it
    // We need a separate read — for now, we show the member deposit status

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] overflow-hidden">
                <div className="p-4 border-b border-[var(--cs-border-light)]">
                    <h3 className="font-semibold">Deposit Status</h3>
                </div>
                <div className="divide-y divide-[var(--cs-border-light)]">
                    {members.map((memberAddr) => (
                        <DepositRow
                            key={memberAddr}
                            memberAddress={memberAddr}
                            groupAddress={groupAddress}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function DepositRow({
    memberAddress,
    groupAddress,
}: {
    memberAddress: Address;
    groupAddress: Address;
}) {
    const { data: hasDeposited } = useHasDeposited(groupAddress, memberAddress);
    const deposited = hasDeposited as boolean | undefined;
    const shortAddr = `${memberAddress.slice(0, 6)}...${memberAddress.slice(-4)}`;

    return (
        <div className="p-4 flex items-center justify-between">
            <span className="font-mono text-sm">{shortAddr}</span>
            <Badge variant={deposited ? "default" : "outline"}>
                {deposited ? "Deposited" : "Pending"}
            </Badge>
        </div>
    );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

function SettingsTab({ groupAddress }: { groupAddress: string }) {
    const copyAddress = () => {
        navigator.clipboard.writeText(groupAddress);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-4">
                <h3 className="font-semibold mb-4">Group Contract</h3>
                <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[var(--cs-bg-gray)] px-3 py-2 rounded-lg text-sm font-mono">
                        {groupAddress}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyAddress}>
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                        <a
                            href={explorerAddressUrl(groupAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// ESCROW LIFECYCLE ACTION BAR
// ============================================================================

function EscrowActionBar({
    groupAddress,
    groupState,
    userAddress,
    tokenAddress,
}: {
    groupAddress: Address;
    groupState: number;
    userAddress: Address;
    tokenAddress: Address | undefined;
}) {
    const { data: hasDeposited } = useHasDeposited(groupAddress, userAddress);
    const deposited = (hasDeposited as boolean) ?? false;

    const requiredDepositResult = useRequiredDeposit(groupAddress);
    const requiredDeposit = requiredDepositResult.data as bigint | undefined;

    const deadlineResult = useDepositDeadline(groupAddress);
    const deadline = deadlineResult.data as bigint | undefined;

    const { data: hasVoted } = useCloseVote(groupAddress, userAddress);
    const alreadyVoted = (hasVoted as boolean) ?? false;

    // Write hooks
    const { approve, isPending: approvePending, isConfirming: approveConfirming, isSuccess: approveSuccess } = useTokenApprove(tokenAddress);
    const { deposit, isPending: depositPending, isConfirming: depositConfirming, isSuccess: depositSuccess } = useDeposit(groupAddress);
    const { cancelGroup, isPending: cancelPending, isConfirming: cancelConfirming, isSuccess: cancelSuccess } = useCancelGroup(groupAddress);
    const { proposeClose, isPending: proposePending, isConfirming: proposeConfirming, isSuccess: proposeSuccess } = useProposeClose(groupAddress);
    const { voteClose, isPending: votePending, isConfirming: voteConfirming, isSuccess: voteSuccess } = useVoteClose(groupAddress);
    const { withdraw, isPending: withdrawPending, isConfirming: withdrawConfirming, isSuccess: withdrawSuccess } = useWithdraw(groupAddress, true);
    const { refundDeposit, isPending: refundPending, isConfirming: refundConfirming, isSuccess: refundSuccess } = useRefundDeposit(groupAddress);
    const { checkDeadline, isPending: deadlinePending, isConfirming: deadlineConfirming } = useCheckDeadline(groupAddress);

    const hasTriggeredDeposit = useRef(false);

    // Approve → Deposit chain
    const handleDeposit = () => {
        if (!requiredDeposit || !groupAddress) return;
        hasTriggeredDeposit.current = false;
        approve(groupAddress, requiredDeposit);
    };

    useEffect(() => {
        if (approveSuccess && !hasTriggeredDeposit.current) {
            hasTriggeredDeposit.current = true;
            deposit();
        }
    }, [approveSuccess]);

    const isPending = groupState === GroupState.Pending;
    const isActive = groupState === GroupState.Active;
    const isClosePending = groupState === GroupState.ClosePending;
    const isClosed = groupState === GroupState.Closed;
    const isCancelled = groupState === GroupState.Cancelled;

    const deadlineDate = deadline ? new Date(Number(deadline) * 1000) : null;
    const isDeadlinePassed = deadlineDate ? deadlineDate < new Date() : false;

    return (
        <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
                {/* Pending: Deposit or Cancel */}
                {isPending && !deposited && !depositSuccess && (
                    <Button
                        onClick={handleDeposit}
                        disabled={approvePending || approveConfirming || depositPending || depositConfirming}
                        className="rounded-full bg-[var(--cs-accent-green)] hover:bg-[var(--cs-accent-green-hover)] text-[var(--cs-text-primary)]"
                    >
                        {(approvePending || approveConfirming || depositPending || depositConfirming) ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Deposit
                    </Button>
                )}
                {(deposited || depositSuccess) && isPending && (
                    <Badge className="bg-[var(--cs-success)] text-white">Deposited ✓</Badge>
                )}
                {isPending && (
                    <Button
                        variant="outline"
                        onClick={() => cancelGroup()}
                        disabled={cancelPending || cancelConfirming}
                        className="rounded-full border-[var(--cs-error)] text-[var(--cs-error)]"
                    >
                        {(cancelPending || cancelConfirming) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Cancel Group
                    </Button>
                )}
                {isPending && isDeadlinePassed && (
                    <Button
                        variant="outline"
                        onClick={() => checkDeadline()}
                        disabled={deadlinePending || deadlineConfirming}
                        className="rounded-full"
                    >
                        Check Deadline
                    </Button>
                )}

                {/* Active: Propose Close */}
                {isActive && (
                    <Button
                        onClick={() => proposeClose()}
                        disabled={proposePending || proposeConfirming}
                        className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {(proposePending || proposeConfirming) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Propose Close
                    </Button>
                )}

                {/* ClosePending: Vote */}
                {isClosePending && !alreadyVoted && !voteSuccess && (
                    <Button
                        onClick={() => voteClose()}
                        disabled={votePending || voteConfirming}
                        className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {(votePending || voteConfirming) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Vote to Close
                    </Button>
                )}
                {isClosePending && (alreadyVoted || voteSuccess) && (
                    <Badge className="bg-[var(--cs-success)] text-white">Voted ✓</Badge>
                )}

                {/* Closed: Withdraw */}
                {isClosed && !withdrawSuccess && (
                    <Button
                        onClick={() => withdraw()}
                        disabled={withdrawPending || withdrawConfirming}
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {(withdrawPending || withdrawConfirming) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Withdraw
                    </Button>
                )}
                {isClosed && withdrawSuccess && (
                    <Badge className="bg-[var(--cs-success)] text-white">Withdrawn ✓</Badge>
                )}

                {/* Cancelled: Refund */}
                {isCancelled && !refundSuccess && (
                    <Button
                        onClick={() => refundDeposit()}
                        disabled={refundPending || refundConfirming}
                        className="rounded-full bg-red-500 hover:bg-red-600 text-white"
                    >
                        {(refundPending || refundConfirming) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Refund Deposit
                    </Button>
                )}
                {isCancelled && refundSuccess && (
                    <Badge className="bg-[var(--cs-success)] text-white">Refunded ✓</Badge>
                )}

                {cancelSuccess && <Badge className="bg-[var(--cs-success)] text-white">Cancelled ✓</Badge>}
                {proposeSuccess && <Badge className="bg-[var(--cs-success)] text-white">Close Proposed ✓</Badge>}

                {deadlineDate && isPending && (
                    <span className="text-sm text-[var(--cs-text-secondary)] ml-auto">
                        Deadline: {deadlineDate.toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

/**
 * Group Detail Page
 * Reads all data from the group contract — no mock data
 */
export default function GroupDetailPage() {
    const params = useParams();
    const groupAddress = params.id as Address;
    const [activeTab, setActiveTab] = useState("overview");
    const { address: userAddress } = useWallet();

    // Read group mode and info from contracts
    const { isEscrow, isDirect, isLoading: modeLoading } = useGroupMode(groupAddress);

    // Subscribe to real-time contract events via WebSocket
    useGroupEvents(groupAddress, isEscrow);
    const infoResult = useGroupInfo(groupAddress, isEscrow);

    // Mode-specific decode:
    // Direct:  [name, token, memberCount, expenseCount]
    // Escrow:  [name, token, state, memberCount, depositCount]
    const directInfo = !isEscrow
        ? (infoResult.data as [string, Address, bigint, bigint] | undefined)
        : undefined;
    const escrowInfo = isEscrow
        ? (infoResult.data as [string, Address, number, bigint, bigint] | undefined)
        : undefined;

    const tokenAddress = directInfo?.[1] ?? escrowInfo?.[1];
    const tokenResult = useTokenInfo(tokenAddress);
    const tokenDecimals = (tokenResult.decimals as number) ?? 18;
    const tokenSymbol = (tokenResult.symbol as string) ?? "TOKEN";

    // Escrow: read expenseCount separately (not in getGroupInfo)
    const escrowExpenseCountResult = useEscrowExpenseCount(
        isEscrow ? groupAddress : undefined
    );

    const isLoading = modeLoading || infoResult.isLoading;

    if (isLoading || (!directInfo && !escrowInfo)) {
        return (
            <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
                <Navbar />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--cs-text-secondary)]" />
                </div>
            </div>
        );
    }

    let name: string;
    let memberCount: number;
    let expenseCount: number;
    let groupState: number | undefined;
    let depositCount: number | undefined;

    if (isEscrow && escrowInfo) {
        name = escrowInfo[0];
        groupState = escrowInfo[2];
        memberCount = Number(escrowInfo[3]);
        depositCount = Number(escrowInfo[4]);
        expenseCount = Number((escrowExpenseCountResult.data as bigint) ?? BigInt(0));
    } else if (directInfo) {
        name = directInfo[0];
        memberCount = Number(directInfo[2]);
        expenseCount = Number(directInfo[3]);
    } else {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
            <Navbar />

            <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold text-[var(--cs-text-primary)]">
                                {name}
                            </h1>
                            <Badge
                                variant={isDirect ? "default" : "outline"}
                                className={cn(
                                    "rounded-full",
                                    isDirect ? "bg-[var(--cs-card-dark)]" : ""
                                )}
                            >
                                {isDirect ? "Direct" : "Escrow"}
                            </Badge>
                            {isEscrow && groupState !== undefined && (
                                <Badge className={cn("rounded-full text-white", {
                                    "bg-yellow-500": groupState === GroupState.Pending,
                                    "bg-green-600": groupState === GroupState.Active,
                                    "bg-orange-500": groupState === GroupState.ClosePending,
                                    "bg-blue-600": groupState === GroupState.Closed,
                                    "bg-red-500": groupState === GroupState.Cancelled,
                                })}>
                                    {GroupState[groupState] ?? "Unknown"}
                                </Badge>
                            )}
                        </div>
                        <p className="text-[var(--cs-text-secondary)] mt-1">
                            {memberCount} members · {expenseCount} expenses
                            {isEscrow && depositCount !== undefined && ` · ${depositCount}/${memberCount} deposited`}
                        </p>
                    </div>
                </div>

                {/* Escrow Lifecycle Action Bar */}
                {isEscrow && userAddress && (
                    <EscrowActionBar
                        groupAddress={groupAddress}
                        groupState={groupState ?? 0}
                        userAddress={userAddress}
                        tokenAddress={tokenAddress}
                    />
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start bg-transparent border-b border-[var(--cs-border-light)] rounded-none p-0 h-auto mb-6">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="expenses"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            Expenses
                        </TabsTrigger>
                        {isEscrow && (
                            <TabsTrigger
                                value="deposits"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Deposits
                            </TabsTrigger>
                        )}
                        <TabsTrigger
                            value="settings"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TabsContent value="overview" className="mt-0">
                                <OverviewTab
                                    groupAddress={groupAddress}
                                    memberCount={memberCount}
                                    expenseCount={expenseCount}
                                    isEscrow={isEscrow}
                                    tokenDecimals={tokenDecimals}
                                    tokenSymbol={tokenSymbol}
                                    userAddress={userAddress!}
                                />
                            </TabsContent>
                            <TabsContent value="expenses" className="mt-0">
                                <ExpensesTab
                                    groupAddress={groupAddress}
                                    expenseCount={expenseCount}
                                    isEscrow={isEscrow}
                                    tokenDecimals={tokenDecimals}
                                    tokenSymbol={tokenSymbol}
                                    tokenAddress={tokenAddress}
                                    userAddress={userAddress!}
                                />
                            </TabsContent>
                            {isEscrow && (
                                <TabsContent value="deposits" className="mt-0">
                                    <DepositsTab
                                        groupAddress={groupAddress}
                                        memberCount={memberCount}
                                        tokenDecimals={tokenDecimals}
                                        tokenSymbol={tokenSymbol}
                                    />
                                </TabsContent>
                            )}
                            <TabsContent value="settings" className="mt-0">
                                <SettingsTab groupAddress={groupAddress} />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </main>
        </div>
    );
}
