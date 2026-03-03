"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BalanceChip } from "@/components/display/balance-display";
import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle, ChevronRight, Users } from "lucide-react";

type ExpenseState = "pending" | "accepted" | "settled" | "cancelled";

interface ExpenseCardProps {
    id: string | number;
    groupId: string;
    payer: string;
    totalAmount: number;
    yourShare: number;
    tokenSymbol: string;
    description: string;
    state: ExpenseState;
    acceptedCount: number;
    totalParticipants: number;
    isPayer: boolean;
    hasAccepted: boolean;
    onAccept?: () => void;
    onSettle?: () => void;
    onCancel?: () => void;
}

/**
 * Get state badge props — cyberpunk styled
 */
function getStateBadge(state: ExpenseState) {
    switch (state) {
        case "pending":
            return {
                label: "Pending",
                variant: "outline" as const,
                className: "border-[var(--cs-warning)] text-[var(--cs-warning)] shadow-[0_0_6px_rgba(255,170,0,0.2)]",
                icon: Clock,
            };
        case "accepted":
            return {
                label: "Ready",
                variant: "outline" as const,
                className: "border-[var(--cs-accent-green)] text-[var(--cs-accent-green)] shadow-[0_0_6px_rgba(0,255,136,0.2)]",
                icon: Check,
            };
        case "settled":
            return {
                label: "Settled",
                variant: "default" as const,
                className: "bg-[var(--cs-success)] text-[var(--cs-text-on-light)] shadow-[0_0_8px_rgba(0,255,136,0.3)]",
                icon: Check,
            };
        case "cancelled":
            return {
                label: "Cancelled",
                variant: "outline" as const,
                className: "border-[var(--cs-text-secondary)] text-[var(--cs-text-secondary)]",
                icon: AlertCircle,
            };
    }
}

/**
 * Truncate address
 */
function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Expense Card Component — Cyberpunk styled
 */
export function ExpenseCard({
    id,
    groupId,
    payer,
    totalAmount,
    yourShare,
    tokenSymbol,
    description,
    state,
    acceptedCount,
    totalParticipants,
    isPayer,
    hasAccepted,
    onAccept,
    onSettle,
    onCancel,
}: ExpenseCardProps) {
    const badge = getStateBadge(state);
    const BadgeIcon = badge.icon;
    const showAcceptButton = !isPayer && !hasAccepted && state === "pending";
    const showSettleButton = isPayer && state === "accepted";
    const showCancelButton = isPayer && state === "pending";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card rounded-xl p-4 sm:p-5 group"
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                        <div>
                            <h3 className="font-medium text-[var(--cs-text-primary)] truncate">
                                {description}
                            </h3>
                            <p className="text-sm text-[var(--cs-text-secondary)]">
                                Paid by {isPayer ? "you" : truncateAddress(payer)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={badge.variant} className={cn("text-xs", badge.className)}>
                            <BadgeIcon className="w-3 h-3 mr-1" />
                            {badge.label}
                        </Badge>

                        {state === "pending" && (
                            <span className="text-xs text-[var(--cs-text-secondary)] flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {acceptedCount}/{totalParticipants} accepted
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                        <p className="text-lg font-semibold text-[var(--cs-text-primary)]">
                            ${totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-[var(--cs-text-secondary)]">
                            Your share: <BalanceChip balance={-yourShare} tokenSymbol={tokenSymbol} />
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {showAcceptButton && (
                            <Button
                                onClick={onAccept}
                                size="sm"
                                className="app-btn-accent"
                            >
                                Accept
                            </Button>
                        )}
                        {showSettleButton && (
                            <Button
                                onClick={onSettle}
                                size="sm"
                                className="app-btn-info"
                            >
                                Settle
                            </Button>
                        )}
                        {showCancelButton && (
                            <Button
                                onClick={onCancel}
                                size="sm"
                                variant="outline"
                                className="text-[var(--cs-error)] border-[var(--cs-error)] hover:bg-[rgba(255,51,85,0.1)]"
                            >
                                Cancel
                            </Button>
                        )}

                        <Link href={`/groups/${groupId}/expense/${id}`}>
                            <Button variant="ghost" size="icon">
                                <ChevronRight className="w-5 h-5 text-[var(--cs-text-secondary)] group-hover:text-[var(--cs-accent-green)]" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Expense Card List
 */
export function ExpenseCardList({
    expenses,
    groupId,
}: {
    expenses: Omit<ExpenseCardProps, "groupId">[];
    groupId: string;
}) {
    if (expenses.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-[var(--cs-text-secondary)]">No expenses yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {expenses.map((expense) => (
                <ExpenseCard key={expense.id} {...expense} groupId={groupId} />
            ))}
        </div>
    );
}
