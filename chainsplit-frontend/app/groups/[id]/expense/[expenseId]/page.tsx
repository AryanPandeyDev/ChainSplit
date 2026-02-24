"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ExternalLink, CheckCircle2, Clock, XCircle } from "lucide-react";
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
    useExpense,
    useExpenseParticipants,
    useSettleExpense,
    useGroupEvents,
    useTokenInfo,
    expenseStateLabel,
} from "@/hooks";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

interface ExpenseMetadata {
    description: string;
    amount: string;
    receiptCid?: string;
}

export default function ExpenseDetailPage() {
    const params = useParams();
    const groupAddress = params.id as Address;
    const expenseId = BigInt(params.expenseId as string);

    const { address: userAddress } = useWallet();
    const { isEscrow, isLoading: modeLoading } = useGroupMode(groupAddress);

    // Subscribe to real-time contract events via WebSocket
    useGroupEvents(groupAddress, isEscrow);

    // Group info for token
    const infoResult = useGroupInfo(groupAddress, isEscrow);
    const groupInfo = infoResult.data as [string, Address, bigint, bigint] | undefined;
    const groupName = groupInfo?.[0] ?? "Group";
    const tokenAddress = groupInfo?.[1];
    const tokenResult = useTokenInfo(tokenAddress);
    const tokenDecimals = (tokenResult.decimals as number) ?? 18;
    const tokenSymbol = (tokenResult.symbol as string) ?? "TOKEN";

    // Expense data from contract
    const expenseResult = useExpense(groupAddress, expenseId, isEscrow);
    const expenseData = expenseResult.data as
        | [string, bigint, string, number, bigint]
        | undefined;

    const participantsResult = useExpenseParticipants(groupAddress, expenseId, isEscrow);
    const participantsData = participantsResult.data as [string[], bigint[]] | undefined;

    // IPFS metadata
    const [metadata, setMetadata] = useState<ExpenseMetadata | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);

    const ipfsCid = expenseData?.[2];

    useEffect(() => {
        if (!ipfsCid) return;
        setMetadataLoading(true);
        fetch(`${PINATA_GATEWAY}/${ipfsCid}`)
            .then((res) => res.json())
            .then((data) => setMetadata(data))
            .catch(() => setMetadata(null))
            .finally(() => setMetadataLoading(false));
    }, [ipfsCid]);

    // ALL hooks must be called unconditionally (before any early return)
    const {
        settleExpense,
        isPending: settlePending,
        isConfirming: settleConfirming,
        isSuccess: settleSuccess,
        error: settleError,
    } = useSettleExpense(groupAddress);

    const isLoading = modeLoading || expenseResult.isLoading || infoResult.isLoading;

    if (isLoading || !expenseData) {
        return (
            <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
                <Navbar />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--cs-text-secondary)]" />
                </div>
            </div>
        );
    }

    const [payer, amountRaw, , stateNum, acceptedCountRaw] = expenseData;
    const amount = Number(formatUnits(amountRaw, tokenDecimals));
    const state = Number(stateNum);
    const acceptedCount = Number(acceptedCountRaw);
    const stateLabel = expenseStateLabel(state);
    const shortPayer = `${payer.slice(0, 6)}...${payer.slice(-4)}`;

    // Participants
    const participants = participantsData?.[0] ?? [];
    const shares = participantsData?.[1] ?? [];
    const nonPayerCount = participants.filter(
        (p) => p.toLowerCase() !== payer.toLowerCase()
    ).length;

    // Settle logic (hook already called above early return)
    const isUserPayer = userAddress?.toLowerCase() === payer.toLowerCase();
    const allAccepted = nonPayerCount > 0 && acceptedCount >= nonPayerCount;
    const canSettle = state === 0 && isUserPayer && allAccepted && !settleSuccess;
    const isSettling = settlePending || settleConfirming;

    return (
        <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Back link */}
                <Link
                    href={`/groups/${groupAddress}`}
                    className="inline-flex items-center gap-1 text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {groupName}
                </Link>

                {/* Header */}
                <div className="bg-white rounded-2xl border border-[var(--cs-border-light)] p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">
                                Expense #{params.expenseId as string}
                            </h1>
                            {metadata?.description && (
                                <p className="text-[var(--cs-text-secondary)] text-lg">
                                    {metadata.description}
                                </p>
                            )}
                            {metadataLoading && (
                                <p className="text-sm text-[var(--cs-text-secondary)]">
                                    Loading description...
                                </p>
                            )}
                        </div>
                        <Badge
                            className={cn(
                                "text-sm px-3 py-1",
                                stateLabel === "settled"
                                    ? "bg-[var(--cs-success)] text-white"
                                    : stateLabel === "cancelled"
                                        ? "bg-[var(--cs-error)] text-white"
                                        : "bg-[var(--cs-warning)] text-white"
                            )}
                        >
                            {stateLabel === "settled" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                            {stateLabel === "pending" && <Clock className="w-4 h-4 mr-1" />}
                            {stateLabel === "cancelled" && <XCircle className="w-4 h-4 mr-1" />}
                            {stateLabel}
                        </Badge>
                    </div>

                    {/* Amount */}
                    <div className="bg-[var(--cs-bg-offwhite)] rounded-xl p-4 mb-4">
                        <p className="text-sm text-[var(--cs-text-secondary)] mb-1">Total Amount</p>
                        <p className="text-3xl font-bold">
                            {amount.toFixed(2)} <span className="text-lg text-[var(--cs-text-secondary)]">{tokenSymbol}</span>
                        </p>
                    </div>

                    {/* Payer & Acceptance Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[var(--cs-bg-offwhite)] rounded-xl p-4">
                            <p className="text-sm text-[var(--cs-text-secondary)] mb-1">Paid by</p>
                            <p className="font-mono text-sm font-medium">{shortPayer}</p>
                            <p className="text-xs text-[var(--cs-text-secondary)] mt-1 font-mono truncate">{payer}</p>
                        </div>
                        <div className="bg-[var(--cs-bg-offwhite)] rounded-xl p-4">
                            <p className="text-sm text-[var(--cs-text-secondary)] mb-1">Acceptance Progress</p>
                            <p className="text-xl font-bold">
                                {acceptedCount} / {nonPayerCount}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-[var(--cs-success)] h-2 rounded-full transition-all"
                                    style={{
                                        width: nonPayerCount > 0
                                            ? `${Math.min((acceptedCount / nonPayerCount) * 100, 100)}%`
                                            : "0%",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Settle Action */}
                    {(canSettle || settleSuccess || settleError) && (
                        <div className="mt-4 bg-[var(--cs-bg-offwhite)] rounded-xl p-4">
                            {canSettle && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Ready to Settle</p>
                                        <p className="text-sm text-[var(--cs-text-secondary)]">
                                            All participants have accepted. Settle to transfer funds.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => settleExpense(expenseId)}
                                        disabled={isSettling}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                                    >
                                        {isSettling ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        {isSettling ? "Settling..." : "Settle Expense"}
                                    </Button>
                                </div>
                            )}
                            {settleSuccess && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Expense settled successfully!</span>
                                </div>
                            )}
                            {settleError && (
                                <p className="text-sm text-[var(--cs-error)]">
                                    Error: {settleError.message?.slice(0, 150)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Participants */}
                <div className="bg-white rounded-2xl border border-[var(--cs-border-light)] p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Participants & Shares</h2>
                    <div className="space-y-3">
                        {participants.map((participant, i) => {
                            const share = Number(formatUnits(shares[i], tokenDecimals));
                            const isPayer = participant.toLowerCase() === payer.toLowerCase();
                            const shortAddr = `${participant.slice(0, 6)}...${participant.slice(-4)}`;

                            return (
                                <ParticipantRow
                                    key={participant}
                                    participant={participant}
                                    shortAddr={shortAddr}
                                    share={share}
                                    tokenSymbol={tokenSymbol}
                                    isPayer={isPayer}
                                    expenseId={expenseId}
                                    groupAddress={groupAddress}
                                    isEscrow={isEscrow}
                                    isPending={state === 0}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* IPFS Receipt */}
                {metadata?.receiptCid && (
                    <div className="bg-white rounded-2xl border border-[var(--cs-border-light)] p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Receipt</h2>
                            <a
                                href={`${PINATA_GATEWAY}/${metadata.receiptCid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                                View on IPFS <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`${PINATA_GATEWAY}/${metadata.receiptCid}`}
                            alt="Expense receipt"
                            className="max-w-full rounded-xl border border-[var(--cs-border-light)]"
                        />
                    </div>
                )}

                {/* IPFS Info */}
                {ipfsCid && (
                    <div className="bg-white rounded-2xl border border-[var(--cs-border-light)] p-6">
                        <h2 className="text-lg font-semibold mb-2">On-chain Metadata</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--cs-text-secondary)]">IPFS CID:</span>
                            <code className="text-xs bg-[var(--cs-bg-offwhite)] px-2 py-1 rounded font-mono break-all">
                                {ipfsCid}
                            </code>
                            <a
                                href={`${PINATA_GATEWAY}/${ipfsCid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/**
 * Individual participant row with on-chain acceptance status
 */
function ParticipantRow({
    participant,
    shortAddr,
    share,
    tokenSymbol,
    isPayer,
    expenseId,
    groupAddress,
    isEscrow,
    isPending,
}: {
    participant: string;
    shortAddr: string;
    share: number;
    tokenSymbol: string;
    isPayer: boolean;
    expenseId: bigint;
    groupAddress: Address;
    isEscrow: boolean;
    isPending: boolean;
}) {
    // Read on-chain acceptance status for non-payer participants
    const hasAcceptedResult = useReadContract({
        address: groupAddress,
        abi: isEscrow ? groupEscrowAbi : groupDirectAbi,
        functionName: "hasAccepted",
        args: [expenseId, participant as Address],
        query: {
            enabled: isPending && !isPayer,
        },
    });
    const accepted = (hasAcceptedResult.data as boolean) ?? false;

    return (
        <div className="flex items-center justify-between bg-[var(--cs-bg-offwhite)] rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        isPayer
                            ? "bg-blue-100 text-blue-700"
                            : accepted
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                    )}
                >
                    {isPayer ? "P" : accepted ? "✓" : "?"}
                </div>
                <div>
                    <p className="font-mono text-sm font-medium">{shortAddr}</p>
                    <div className="flex items-center gap-2">
                        {isPayer && (
                            <span className="text-xs text-blue-600 font-medium">Payer</span>
                        )}
                        {!isPayer && isPending && (
                            <span className={cn(
                                "text-xs font-medium",
                                accepted ? "text-green-600" : "text-amber-600"
                            )}>
                                {accepted ? "Accepted" : "Pending"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <span className="font-semibold">
                {share.toFixed(2)} {tokenSymbol}
            </span>
        </div>
    );
}
