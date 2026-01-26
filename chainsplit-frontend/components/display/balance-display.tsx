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
 * Balance Display Component
 * Shows balance with color coding (positive=green, negative=red, zero=neutral)
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
    const isZero = balance === 0;

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
        ? "text-[var(--cs-success)]"
        : isNegative
            ? "text-[var(--cs-error)]"
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
 * Compact balance for tables/lists
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
                isPositive && "bg-[var(--cs-success)]/10 text-[var(--cs-success)]",
                isNegative && "bg-[var(--cs-error)]/10 text-[var(--cs-error)]",
                !isPositive && !isNegative && "bg-[var(--cs-bg-gray)] text-[var(--cs-text-secondary)]"
            )}
        >
            {isPositive ? "+" : ""}
            {balance.toFixed(2)} {tokenSymbol}
        </span>
    );
}
