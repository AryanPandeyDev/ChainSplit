"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BalanceDisplayProps {
    /** Balance amount (can be negative) */
    balance: number;
    /** Token symbol (e.g., USDC) */
    tokenSymbol: string;
    /** Size variant */
    size?: "sm" | "md" | "lg";
    /** Show icon indicator */
    showIcon?: boolean;
    /** Additional class names */
    className?: string;
}

/**
 * Balance Display Component — Cyberpunk styled
 * Shows balance with neon color coding (positive=neon green, negative=neon red, zero=neutral)
 */
export function BalanceDisplay({
    balance,
    tokenSymbol,
    size = "md",
    showIcon = true,
    className,
}: BalanceDisplayProps) {
    const isPositive = balance > 0;
    const isNegative = balance < 0;

    const sizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-2xl font-semibold",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    const colorClass = isPositive
        ? "text-[var(--cs-success)] drop-shadow-[0_0_6px_rgba(0,255,136,0.4)]"
        : isNegative
            ? "text-[var(--cs-error)] drop-shadow-[0_0_6px_rgba(255,51,85,0.4)]"
            : "text-[var(--cs-text-secondary)]";

    const Icon = isPositive
        ? TrendingUp
        : isNegative
            ? TrendingDown
            : Minus;

    const prefix = isPositive ? "+" : isNegative ? "-" : "";
    const formattedAmount = Math.abs(balance).toFixed(2);

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5",
                sizeClasses[size],
                colorClass,
                className
            )}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            <span>
                {prefix}${formattedAmount} {tokenSymbol}
            </span>
        </span>
    );
}

/**
 * Compact balance chip — Cyberpunk styled with neon glow backgrounds
 */
export function BalanceChip({
    balance,
    tokenSymbol,
}: {
    balance: number;
    tokenSymbol: string;
}) {
    const isPositive = balance > 0;
    const isNegative = balance < 0;

    return (
        <span
            className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                isPositive && "bg-[rgba(0,255,136,0.1)] text-[var(--cs-success)] shadow-[0_0_4px_rgba(0,255,136,0.15)]",
                isNegative && "bg-[rgba(255,51,85,0.1)] text-[var(--cs-error)] shadow-[0_0_4px_rgba(255,51,85,0.15)]",
                !isPositive && !isNegative && "bg-[var(--cs-bg-gray)] text-[var(--cs-text-secondary)]"
            )}
        >
            {isPositive ? "+" : ""}
            {balance.toFixed(2)} {tokenSymbol}
        </span>
    );
}
