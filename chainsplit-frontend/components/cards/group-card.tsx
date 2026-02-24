"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupCardProps {
    address: string;
    name: string;
    mode: "direct" | "escrow";
    memberCount: number;
    expenseCount: number;
    balance: number;
    tokenSymbol: string;
}

/**
 * Format balance for display with color coding
 */
function formatBalance(balance: number, symbol: string) {
    const formatted = Math.abs(balance).toFixed(2);
    const prefix = balance >= 0 ? "+" : "-";
    return `${prefix}$${formatted} ${symbol}`;
}

/**
 * Get balance color based on value
 */
function getBalanceColor(balance: number) {
    if (balance > 0) return "text-[var(--cs-accent-green)]";
    if (balance < 0) return "text-[var(--cs-error)]";
    return "text-[var(--cs-text-secondary)]";
}

/**
 * Individual Group Card
 */
export function GroupCard({
    address,
    name,
    mode,
    memberCount,
    expenseCount,
    balance,
    tokenSymbol,
}: GroupCardProps) {
    return (
        <Link href={`/groups/${address}`}>
            <motion.div
                whileHover={{ scale: 1.01, boxShadow: "var(--cs-shadow-card-hover)" }}
                whileTap={{ scale: 0.99 }}
                className="bg-[var(--cs-card-bg)] border border-[var(--cs-border-light)] rounded-2xl p-5 sm:p-6 cursor-pointer transition-colors hover:border-[var(--cs-accent-green)]"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[var(--cs-text-primary)] truncate">
                                {name}
                            </h3>
                            <Badge
                                variant={mode === "direct" ? "default" : "outline"}
                                className={cn(
                                    "text-xs font-medium rounded-full px-2.5 py-0.5",
                                    mode === "direct"
                                        ? "bg-[var(--cs-card-dark)] text-[var(--cs-text-on-light)] hover:bg-[var(--cs-card-dark)]"
                                        : "border-[var(--cs-border-light)] text-[var(--cs-text-secondary)]"
                                )}
                            >
                                {mode === "direct" ? "Direct" : "Escrow"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-[var(--cs-text-secondary)]">
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {memberCount} members
                            </span>
                            <span>·</span>
                            <span>{expenseCount} expenses</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-[var(--cs-text-secondary)] mb-0.5">Net Balance</p>
                            <p className={cn("font-semibold", getBalanceColor(balance))}>
                                {formatBalance(balance, tokenSymbol)}
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--cs-text-secondary)]" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

/**
 * List of Group Cards with animation
 */
export function GroupCardList({ groups }: { groups: GroupCardProps[] }) {
    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                },
            }}
            className="space-y-4"
        >
            {groups.map((group) => (
                <motion.div
                    key={group.address}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 },
                    }}
                >
                    <GroupCard {...group} />
                </motion.div>
            ))}
        </motion.div>
    );
}
