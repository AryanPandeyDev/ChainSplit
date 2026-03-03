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

function formatBalance(balance: number, symbol: string) {
    const formatted = Math.abs(balance).toFixed(2);
    const prefix = balance >= 0 ? "+" : "-";
    return `${prefix}$${formatted} ${symbol}`;
}

function getBalanceColor(balance: number) {
    if (balance > 0) return "text-[var(--cs-accent-green)]";
    if (balance < 0) return "text-[var(--cs-error)]";
    return "text-[var(--cs-text-secondary)]";
}

function getBalanceGlow(balance: number) {
    if (balance > 0) return { textShadow: "0 0 10px rgba(0,255,136,0.6), 0 0 30px rgba(0,255,136,0.2)" };
    if (balance < 0) return { textShadow: "0 0 10px rgba(255,51,85,0.6), 0 0 30px rgba(255,51,85,0.2)" };
    return {};
}

/**
 * Individual Group Card — Dramatic cyberpunk floating panel
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.015, y: -4 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="cyber-card cyber-shimmer rounded-2xl p-6 cursor-pointer group relative z-10"
            >
                <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-[var(--cs-text-primary)] truncate group-hover:text-[var(--cs-accent-green)] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                                style={{ fontFamily: "var(--font-app-display)", letterSpacing: "0.1em", textTransform: "uppercase" }}
                            >
                                {name}
                            </h3>
                            <Badge
                                variant={mode === "direct" ? "default" : "outline"}
                                className={cn(
                                    "text-xs font-bold rounded-full px-3 py-0.5 uppercase tracking-widest",
                                    mode === "direct"
                                        ? "bg-[var(--cs-accent-green)] text-[var(--cs-text-on-light)] hover:bg-[var(--cs-accent-green)] shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                                        : "border-[var(--cs-neon-blue)] text-[var(--cs-neon-blue)] shadow-[0_0_10px_rgba(0,212,255,0.2)]"
                                )}
                            >
                                {mode === "direct" ? "Direct" : "Escrow"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-[var(--cs-text-secondary)]" style={{ fontFamily: "var(--font-app-sans)", letterSpacing: "0.06em" }}>
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-[var(--cs-neon-blue)]" />
                                {memberCount} members
                            </span>
                            <span className="text-[rgba(0,255,136,0.3)]">·</span>
                            <span>{expenseCount} expenses</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-[var(--cs-neon-blue)] mb-1 uppercase tracking-[0.15em]"
                                style={{ fontFamily: "var(--font-app-sans)" }}
                            >
                                Net Balance
                            </p>
                            <p
                                className={cn("font-bold text-lg", getBalanceColor(balance))}
                                style={{
                                    fontFamily: "var(--font-app-display)",
                                    letterSpacing: "0.05em",
                                    ...getBalanceGlow(balance),
                                }}
                            >
                                {formatBalance(balance, tokenSymbol)}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[rgba(0,255,136,0.2)] flex items-center justify-center group-hover:border-[var(--cs-accent-green)] group-hover:shadow-[0_0_12px_rgba(0,255,136,0.3)] transition-all duration-300">
                            <ChevronRight className="w-4 h-4 text-[var(--cs-text-secondary)] group-hover:text-[var(--cs-accent-green)] transition-colors" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

/**
 * List of Group Cards with staggered animation
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
                    transition: { staggerChildren: 0.12 },
                },
            }}
            className="space-y-5"
        >
            {groups.map((group) => (
                <motion.div
                    key={group.address}
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        show: { opacity: 1, y: 0 },
                    }}
                >
                    <GroupCard {...group} />
                </motion.div>
            ))}
        </motion.div>
    );
}
