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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

import { explorerTxUrl } from "@/lib/explorer";

type ApprovalType = "exact" | "bounded";

interface AcceptExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense: {
        id: number;
        payer: string;
        totalAmount: number;
        yourShare: number;
        tokenSymbol: string;
    };
    onAccept: (approvalType: ApprovalType, boundedAmount?: number, boundedDays?: number) => Promise<void>;
}

/**
 * Accept Expense Modal for Direct Mode
 * Shows approval options before accepting an expense
 */
export function AcceptExpenseModal({
    open,
    onOpenChange,
    expense,
    onAccept,
}: AcceptExpenseModalProps) {
    const [approvalType, setApprovalType] = useState<ApprovalType>("exact");
    const [boundedAmount, setBoundedAmount] = useState("500");
    const [boundedDays, setBoundedDays] = useState("30");
    const [isApproving, setIsApproving] = useState(false);

    const handleAccept = async () => {
        setIsApproving(true);
        try {
            if (approvalType === "exact") {
                await onAccept("exact");
            } else {
                await onAccept("bounded", parseFloat(boundedAmount), parseInt(boundedDays));
            }
            onOpenChange(false);
        } catch (err) {
            console.error("Accept expense failed:", err);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md font-[family-name:var(--font-app-sans)] tracking-[0.08em]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Accept Expense</DialogTitle>
                    <DialogDescription>
                        Approve token spending to accept this expense
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Expense details */}
                    <div className="bg-[var(--cs-bg-gray)] rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-[var(--cs-text-secondary)]">Paid by</span>
                            <span className="font-mono text-sm">
                                {expense.payer.slice(0, 6)}...{expense.payer.slice(-4)}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[var(--cs-text-secondary)]">Total</span>
                            <span className="font-semibold">${expense.totalAmount.toFixed(2)} {expense.tokenSymbol}</span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--cs-border-light)] pt-2 mt-2">
                            <span className="font-medium">Your share</span>
                            <span className="font-semibold text-lg">${expense.yourShare.toFixed(2)} {expense.tokenSymbol}</span>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-[var(--cs-warning)]/10 border border-[var(--cs-warning)]/30 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-[var(--cs-warning)] flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-[var(--cs-text-primary)]">
                                This requires token approval
                            </p>
                            <p className="text-[var(--cs-text-secondary)] mt-1">
                                The contract will be authorized to transfer ${expense.yourShare.toFixed(2)} {expense.tokenSymbol} from your wallet when the expense is settled.
                            </p>
                        </div>
                    </div>

                    {/* Approval options */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-[var(--cs-text-primary)]">
                            Choose approval type:
                        </p>

                        {/* Exact amount option */}
                        <button
                            type="button"
                            onClick={() => setApprovalType("exact")}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 text-left transition-all",
                                approvalType === "exact"
                                    ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                                    : "border-[var(--cs-border-light)]"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                                        approvalType === "exact"
                                            ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]"
                                            : "border-[var(--cs-border-light)]"
                                    )}
                                >
                                    {approvalType === "exact" && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Approve exact amount (${expense.yourShare.toFixed(2)} {expense.tokenSymbol})
                                        <Badge variant="outline" className="ml-2 text-xs">Recommended</Badge>
                                    </p>
                                    <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                                        Most secure. Approves only this expense.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Bounded amount option */}
                        <button
                            type="button"
                            onClick={() => setApprovalType("bounded")}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 text-left transition-all",
                                approvalType === "bounded"
                                    ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                                    : "border-[var(--cs-border-light)]"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                                        approvalType === "bounded"
                                            ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]"
                                            : "border-[var(--cs-border-light)]"
                                    )}
                                >
                                    {approvalType === "bounded" && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Approve with limit</p>
                                    <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                                        Convenient for multiple expenses. Set your own limit.
                                    </p>

                                    {approvalType === "bounded" && (
                                        <div
                                            className="grid grid-cols-2 gap-3 mt-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div>
                                                <label className="text-xs text-[var(--cs-text-secondary)]">
                                                    Max amount
                                                </label>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-sm">$</span>
                                                    <Input
                                                        type="number"
                                                        value={boundedAmount}
                                                        onChange={(e) => setBoundedAmount(e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-[var(--cs-text-secondary)]">
                                                    Expires in
                                                </label>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Input
                                                        type="number"
                                                        value={boundedDays}
                                                        onChange={(e) => setBoundedDays(e.target.value)}
                                                        className="h-9"
                                                    />
                                                    <span className="text-sm">days</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAccept}
                            disabled={isApproving}
                            className="app-btn-neutral flex-1 h-12"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                "Approve & Accept"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Transaction Status Component
 * Shows pending, success, or failure state for transactions
 */
interface TransactionStatusProps {
    status: "pending" | "success" | "failure";
    txHash?: string;
    message?: string;
    errorReason?: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    successAction?: {
        label: string;
        onClick: () => void;
    };
}

export function TransactionStatus({
    status,
    txHash,
    message,
    errorReason,
    onRetry,
    onDismiss,
    successAction,
}: TransactionStatusProps) {
    const explorerUrl = txHash ? explorerTxUrl(txHash) : undefined;

    if (status === "pending") {
        return (
            <div className="bg-[var(--cs-card-bg)] rounded-xl border border-[var(--cs-border-light)] p-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Loader2 className="w-8 h-8 text-[var(--cs-accent-green)] animate-spin" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">Transaction pending...</p>
                        <p className="text-sm text-[var(--cs-text-secondary)]">
                            {message || "Confirming on chain"}
                        </p>
                    </div>
                </div>
                {txHash && (
                    <div className="mt-4 pt-4 border-t border-[var(--cs-border-light)]">
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] flex items-center gap-1"
                        >
                            Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="bg-[var(--cs-success)]/10 border border-[var(--cs-success)]/30 rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--cs-success)] flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-[var(--cs-success)]">
                            {message || "Transaction successful!"}
                        </p>
                    </div>
                </div>
                {(txHash || successAction) && (
                    <div className="mt-4 pt-4 border-t border-[var(--cs-success)]/20 flex items-center justify-between">
                        {txHash && (
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] flex items-center gap-1"
                            >
                                View on Explorer
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {successAction && (
                            <Button
                                onClick={successAction.onClick}
                                className="app-btn-success"
                            >
                                {successAction.label}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Failure
    return (
        <div className="bg-[var(--cs-error)]/10 border border-[var(--cs-error)]/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--cs-error)] flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-[var(--cs-error)]">Transaction failed</p>
                    {errorReason && (
                        <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                            Reason: {errorReason}
                        </p>
                    )}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--cs-error)]/20 flex gap-3">
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" className="flex-1">
                        Retry
                    </Button>
                )}
                {onDismiss && (
                    <Button onClick={onDismiss} variant="outline" className="flex-1">
                        Dismiss
                    </Button>
                )}
            </div>
        </div>
    );
}
