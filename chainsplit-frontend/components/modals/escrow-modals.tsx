"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Loader2,
    Check,
    AlertTriangle,
    Users,
    ArrowRight,
    Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// DEPOSIT MODAL
// ============================================================================

interface DepositModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requiredDeposit: number;
    tokenSymbol: string;
    tokenAddress: string;
    groupAddress: string;
    onApprove: () => Promise<void>;
    onDeposit: () => Promise<void>;
}

/**
 * Deposit Modal for Escrow Groups
 * Shows required deposit and handles token approval + deposit
 */
export function DepositModal({
    open,
    onOpenChange,
    requiredDeposit,
    tokenSymbol,
    tokenAddress,
    groupAddress,
    onApprove,
    onDeposit,
}: DepositModalProps) {
    const [step, setStep] = useState<"approve" | "deposit" | "done">("approve");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            await onApprove();
            setStep("deposit");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Approval failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeposit = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            await onDeposit();
            setStep("done");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Deposit failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setStep("approve");
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Deposit to Group</DialogTitle>
                    <DialogDescription>
                        Deposit funds to participate in this escrow group
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Amount display */}
                    <div className="bg-[var(--cs-bg-gray)] rounded-xl p-5 text-center">
                        <p className="text-sm text-[var(--cs-text-secondary)] mb-1">
                            Required Deposit
                        </p>
                        <p className="text-3xl font-semibold">
                            ${requiredDeposit.toFixed(2)} <span className="text-lg">{tokenSymbol}</span>
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                        {/* Step 1: Approve */}
                        <div
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                step === "approve"
                                    ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                                    : step === "deposit" || step === "done"
                                        ? "border-[var(--cs-success)] bg-[var(--cs-success)]/5"
                                        : "border-[var(--cs-border-light)] opacity-50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold",
                                        step === "deposit" || step === "done"
                                            ? "bg-[var(--cs-success)]"
                                            : "bg-[var(--cs-accent-green)]"
                                    )}
                                >
                                    {step === "deposit" || step === "done" ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        "1"
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Approve Token</p>
                                    <p className="text-sm text-[var(--cs-text-secondary)]">
                                        Allow the contract to transfer {tokenSymbol}
                                    </p>
                                </div>
                                {step === "approve" && (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isProcessing}
                                        size="sm"
                                        className="bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Approve"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Deposit */}
                        <div
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all",
                                step === "deposit"
                                    ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                                    : step === "done"
                                        ? "border-[var(--cs-success)] bg-[var(--cs-success)]/5"
                                        : "border-[var(--cs-border-light)] opacity-50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                                        step === "done"
                                            ? "bg-[var(--cs-success)] text-white"
                                            : step === "deposit"
                                                ? "bg-[var(--cs-accent-green)] text-white"
                                                : "bg-[var(--cs-bg-gray)] text-[var(--cs-text-secondary)]"
                                    )}
                                >
                                    {step === "done" ? <Check className="w-5 h-5" /> : "2"}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Deposit Funds</p>
                                    <p className="text-sm text-[var(--cs-text-secondary)]">
                                        Transfer {tokenSymbol} to the group escrow
                                    </p>
                                </div>
                                {step === "deposit" && (
                                    <Button
                                        onClick={handleDeposit}
                                        disabled={isProcessing}
                                        size="sm"
                                        className="bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Deposit"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Done state */}
                    {step === "done" && (
                        <div className="bg-[var(--cs-success)]/10 border border-[var(--cs-success)]/30 rounded-xl p-4 text-center">
                            <Check className="w-10 h-10 text-[var(--cs-success)] mx-auto mb-2" />
                            <p className="font-medium text-[var(--cs-success)]">
                                Deposit successful!
                            </p>
                            <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                                You're now an active participant in this group
                            </p>
                        </div>
                    )}

                    {/* Close button */}
                    {step === "done" && (
                        <Button onClick={handleClose} className="w-full h-12">
                            Close
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// CLOSE GROUP MODAL
// ============================================================================

interface CloseGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberCount: number;
    closeVoteCount: number;
    hasVoted: boolean;
    isProposer: boolean;
    onProposeClose: () => Promise<void>;
    onVoteClose: () => Promise<void>;
}

/**
 * Close Group Modal for Escrow Groups
 * Allows proposing close or voting to close
 */
export function CloseGroupModal({
    open,
    onOpenChange,
    memberCount,
    closeVoteCount,
    hasVoted,
    isProposer,
    onProposeClose,
    onVoteClose,
}: CloseGroupModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const votesNeeded = memberCount;
    const progress = (closeVoteCount / votesNeeded) * 100;
    const canClose = closeVoteCount >= votesNeeded;

    const handleAction = async () => {
        setIsProcessing(true);
        if (closeVoteCount === 0) {
            await onProposeClose();
        } else {
            await onVoteClose();
        }
        setIsProcessing(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Close Group</DialogTitle>
                    <DialogDescription>
                        All members must vote to close before funds can be withdrawn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Warning */}
                    <div className="bg-[var(--cs-warning)]/10 border border-[var(--cs-warning)]/30 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-[var(--cs-warning)] flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-[var(--cs-text-primary)]">
                                This requires unanimous agreement
                            </p>
                            <p className="text-[var(--cs-text-secondary)] mt-1">
                                Once all members vote, the group will close and everyone can withdraw their balance.
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--cs-text-secondary)]">Votes to close</span>
                            <span className="font-medium">
                                {closeVoteCount} / {votesNeeded}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Member votes */}
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: memberCount }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    i < closeVoteCount
                                        ? "bg-[var(--cs-success)] text-white"
                                        : "bg-[var(--cs-bg-gray)] text-[var(--cs-text-secondary)]"
                                )}
                            >
                                {i < closeVoteCount ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Users className="w-5 h-5" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Status badge */}
                    {hasVoted && (
                        <div className="text-center">
                            <Badge variant="outline" className="text-[var(--cs-success)] border-[var(--cs-success)]">
                                You've voted to close
                            </Badge>
                        </div>
                    )}

                    {/* Action button */}
                    {!hasVoted && !canClose && (
                        <Button
                            onClick={handleAction}
                            disabled={isProcessing}
                            className="w-full h-12 bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : closeVoteCount === 0 ? (
                                "Propose Close"
                            ) : (
                                "Vote to Close"
                            )}
                        </Button>
                    )}

                    {canClose && (
                        <div className="bg-[var(--cs-success)]/10 border border-[var(--cs-success)]/30 rounded-xl p-4 text-center">
                            <Check className="w-10 h-10 text-[var(--cs-success)] mx-auto mb-2" />
                            <p className="font-medium text-[var(--cs-success)]">
                                Group closed successfully!
                            </p>
                            <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                                You can now withdraw your balance
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// WITHDRAW MODAL
// ============================================================================

interface WithdrawModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    balance: number;
    tokenSymbol: string;
    onWithdraw: () => Promise<void>;
}

/**
 * Withdraw Modal
 * Allows withdrawing available balance
 */
export function WithdrawModal({
    open,
    onOpenChange,
    balance,
    tokenSymbol,
    onWithdraw,
}: WithdrawModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        setIsProcessing(true);
        await onWithdraw();
        setSuccess(true);
        setIsProcessing(false);
    };

    const handleClose = () => {
        setSuccess(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Withdraw your available balance to your wallet
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {!success ? (
                        <>
                            {/* Balance display */}
                            <div className="bg-[var(--cs-bg-gray)] rounded-xl p-5 text-center">
                                <p className="text-sm text-[var(--cs-text-secondary)] mb-1">
                                    Available to Withdraw
                                </p>
                                <p className="text-3xl font-semibold text-[var(--cs-accent-green)]">
                                    ${balance.toFixed(2)} <span className="text-lg">{tokenSymbol}</span>
                                </p>
                            </div>

                            {/* Destination */}
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--cs-border-light)]">
                                <Wallet className="w-5 h-5 text-[var(--cs-text-secondary)]" />
                                <div className="flex-1">
                                    <p className="text-sm text-[var(--cs-text-secondary)]">
                                        Sending to your wallet
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-[var(--cs-text-secondary)]" />
                            </div>

                            {/* Withdraw button */}
                            <Button
                                onClick={handleWithdraw}
                                disabled={isProcessing || balance <= 0}
                                className="w-full h-12 bg-[var(--cs-accent-green)] hover:bg-[var(--cs-accent-green-hover)] text-[var(--cs-text-primary)]"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Withdrawing...
                                    </>
                                ) : (
                                    `Withdraw ${balance.toFixed(2)} ${tokenSymbol}`
                                )}
                            </Button>
                        </>
                    ) : (
                        <div className="bg-[var(--cs-success)]/10 border border-[var(--cs-success)]/30 rounded-xl p-6 text-center">
                            <Check className="w-12 h-12 text-[var(--cs-success)] mx-auto mb-3" />
                            <p className="text-lg font-medium text-[var(--cs-success)]">
                                Withdrawal successful!
                            </p>
                            <p className="text-sm text-[var(--cs-text-secondary)] mt-2">
                                ${balance.toFixed(2)} {tokenSymbol} has been sent to your wallet
                            </p>
                            <Button onClick={handleClose} className="mt-4 w-full">
                                Done
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
