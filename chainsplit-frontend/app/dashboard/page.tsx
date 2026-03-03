"use client";

import { useWallet, useUserGroups } from "@/hooks";
import { useGroupDetails } from "@/hooks/useGroupDetails";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { GroupCard } from "@/components/cards/group-card";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import { useState, useEffect } from "react";
import type { Address } from "viem";

/**
 * Empty state — dramatic cyberpunk
 */
function EmptyState({ onCreateGroup }: { onCreateGroup: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center relative z-10"
        >
            <motion.div
                animate={{
                    scale: [1, 1.08, 1], boxShadow: [
                        "0 0 15px rgba(0,255,136,0.2), 0 0 40px rgba(0,255,136,0.08)",
                        "0 0 25px rgba(0,255,136,0.4), 0 0 60px rgba(0,255,136,0.15)",
                        "0 0 15px rgba(0,255,136,0.2), 0 0 40px rgba(0,255,136,0.08)",
                    ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-[rgba(0,255,136,0.06)] border border-[rgba(0,255,136,0.3)] rounded-2xl flex items-center justify-center mb-8"
            >
                <Plus className="w-12 h-12 text-[var(--cs-accent-green)]" />
            </motion.div>
            <h2 className="text-3xl neon-text-green mb-3"
                style={{ fontFamily: "var(--font-app-display)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
                No groups yet
            </h2>
            <p className="text-[var(--cs-text-secondary)] max-w-md mb-10 text-base leading-relaxed">
                Create your first group to start splitting expenses with friends,
                roommates, or travel companions.
            </p>
            <Button
                onClick={onCreateGroup}
                className="app-btn-accent rounded-full px-8 py-6 text-base"
            >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Group
            </Button>
        </motion.div>
    );
}

/**
 * Loading state — pulsing neon
 */
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 relative z-10">
            <motion.div
                animate={{
                    rotate: 360,
                    boxShadow: [
                        "0 0 20px rgba(0,255,136,0.2)",
                        "0 0 40px rgba(0,212,255,0.3)",
                        "0 0 20px rgba(0,255,136,0.2)",
                    ]
                }}
                transition={{
                    rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-16 h-16 rounded-full border-2 border-transparent mb-6"
                style={{
                    borderTopColor: "var(--cs-accent-green)",
                    borderRightColor: "rgba(0,212,255,0.3)",
                }}
            />
            <p className="text-[var(--cs-text-secondary)] uppercase tracking-[0.2em] text-sm"
                style={{ fontFamily: "var(--font-app-sans)" }}
            >
                Loading groups...
            </p>
        </div>
    );
}

/**
 * Not connected — dramatic wallet prompt
 */
function NotConnectedState() {
    const { connect, isConnecting } = useWallet();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center relative z-10"
        >
            <motion.div
                animate={{
                    boxShadow: [
                        "0 0 15px rgba(0,212,255,0.2), 0 0 40px rgba(0,212,255,0.08)",
                        "0 0 25px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.15)",
                        "0 0 15px rgba(0,212,255,0.2), 0 0 40px rgba(0,212,255,0.08)",
                    ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.3)] rounded-2xl flex items-center justify-center mb-8"
            >
                <Wallet className="w-12 h-12 text-[var(--cs-neon-blue)]" />
            </motion.div>
            <h2 className="text-3xl neon-text-blue mb-3"
                style={{ fontFamily: "var(--font-app-display)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
                Connect Wallet
            </h2>
            <p className="text-[var(--cs-text-secondary)] max-w-md mb-10">
                Connect your wallet to view your groups and start splitting expenses on-chain.
            </p>
            <Button
                onClick={connect}
                disabled={isConnecting}
                className="app-btn-neutral rounded-full px-8 py-6 text-base"
            >
                <Wallet className="w-5 h-5 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
        </motion.div>
    );
}

/**
 * Single group card that reads its own data from the contract.
 */
function ConnectedGroupCard({
    groupAddress,
    userAddress,
}: {
    groupAddress: Address;
    userAddress: Address;
}) {
    const { details, isLoading } = useGroupDetails(groupAddress, userAddress);

    if (isLoading || !details) {
        return (
            <div className="cyber-card rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-[rgba(0,255,136,0.08)] rounded w-1/3 mb-4" />
                <div className="h-4 bg-[rgba(0,255,136,0.05)] rounded w-1/2" />
            </div>
        );
    }

    return <GroupCard {...details} />;
}

/**
 * Animated list of connected group cards
 */
function ConnectedGroupCardList({
    groupAddresses,
    userAddress,
}: {
    groupAddresses: Address[];
    userAddress: Address;
}) {
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
            {groupAddresses.map((addr, i) => (
                <motion.div
                    key={addr}
                    variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.98 },
                        show: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.08 }}
                >
                    <ConnectedGroupCard
                        groupAddress={addr}
                        userAddress={userAddress}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

/**
 * Dashboard Page — DRAMATIC cyberpunk
 */
export default function DashboardPage() {
    const { isConnected, address } = useWallet();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const { data: groupAddresses, isLoading, error, refetch } = useUserGroups(address as Address | undefined);

    useEffect(() => {
        if (isConnected && address) {
            refetch();
        }
    }, [isConnected, address, refetch]);

    const groups = (groupAddresses ?? []) as Address[];

    return (
        <div className="app-ui min-h-screen cyber-bg">
            <Navbar />

            <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                {!isConnected ? (
                    <NotConnectedState />
                ) : isLoading ? (
                    <LoadingState />
                ) : (
                    <>
                        {/* Header with glow line */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-10 relative z-10"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                                <div>
                                    <h1 className="text-4xl neon-text-green mb-2"
                                        style={{ fontFamily: "var(--font-app-display)", letterSpacing: "0.14em", textTransform: "uppercase" }}
                                    >
                                        Your Groups
                                    </h1>
                                    <p className="text-[var(--cs-text-secondary)] text-sm uppercase tracking-[0.15em]"
                                        style={{ fontFamily: "var(--font-app-sans)" }}
                                    >
                                        Manage your expense groups and balances
                                    </p>
                                </div>
                                <div className="flex gap-3 self-start sm:self-auto">
                                    <Button
                                        onClick={() => refetch()}
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full w-12 h-12 border-[rgba(0,212,255,0.3)] hover:border-[var(--cs-neon-blue)] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all bg-transparent"
                                        title="Refresh groups"
                                    >
                                        <RefreshCw className="w-5 h-5 text-[var(--cs-neon-blue)]" />
                                    </Button>
                                    <Button
                                        onClick={() => setCreateModalOpen(true)}
                                        className="app-btn-accent rounded-full px-8 py-6"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create Group
                                    </Button>
                                </div>
                            </div>
                            {/* Glowing divider line */}
                            <div className="cyber-glow-line mt-6" />
                        </motion.div>

                        {/* Error State */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="cyber-card rounded-2xl p-5 mb-6 flex justify-between items-center relative z-10"
                                style={{ borderColor: "rgba(255,51,85,0.3)" }}
                            >
                                <p className="text-[var(--cs-error)]">
                                    Failed to load groups. Please try again.
                                </p>
                                <Button onClick={() => refetch()} variant="outline" size="sm" className="border-[var(--cs-error)] text-[var(--cs-error)]">
                                    Retry
                                </Button>
                            </motion.div>
                        )}

                        {/* Groups List */}
                        {groups.length === 0 ? (
                            <EmptyState onCreateGroup={() => setCreateModalOpen(true)} />
                        ) : (
                            <ConnectedGroupCardList
                                groupAddresses={groups}
                                userAddress={address!}
                            />
                        )}
                    </>
                )}
            </main>

            {/* Create Group Modal */}
            <CreateGroupModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onGroupCreated={() => refetch()}
            />
        </div>
    );
}
