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
 * Empty state when user has no groups
 */
function EmptyState({ onCreateGroup }: { onCreateGroup: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
            <div className="w-20 h-20 bg-[var(--cs-bg-gray)] rounded-full flex items-center justify-center mb-6">
                <Plus className="w-10 h-10 text-[var(--cs-text-secondary)]" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--cs-text-primary)] mb-2">
                No groups yet
            </h2>
            <p className="text-[var(--cs-text-secondary)] max-w-md mb-8">
                Create your first group to start splitting expenses with friends,
                roommates, or travel companions.
            </p>
            <Button
                onClick={onCreateGroup}
                className="rounded-full px-6 py-5 bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)] text-white"
            >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Group
            </Button>
        </motion.div>
    );
}

/**
 * Loading state
 */
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <Loader2 className="w-10 h-10 text-[var(--cs-text-secondary)] animate-spin mb-4" />
            <p className="text-[var(--cs-text-secondary)]">Loading your groups...</p>
        </div>
    );
}

/**
 * Not connected state
 */
function NotConnectedState() {
    const { connect, isConnecting } = useWallet();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
            <div className="w-20 h-20 bg-[var(--cs-bg-gray)] rounded-full flex items-center justify-center mb-6">
                <Wallet className="w-10 h-10 text-[var(--cs-text-secondary)]" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--cs-text-primary)] mb-2">
                Connect Your Wallet
            </h2>
            <p className="text-[var(--cs-text-secondary)] max-w-md mb-8">
                Connect your wallet to view your groups and start splitting expenses on-chain.
            </p>
            <Button
                onClick={connect}
                disabled={isConnecting}
                className="rounded-full px-6 py-5 bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)] text-white"
            >
                <Wallet className="w-5 h-5 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
        </motion.div>
    );
}

/**
 * Single group card that reads its own data from the contract.
 * Each card is its own component so it can call hooks individually.
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
            <div className="bg-white border border-[var(--cs-border-light)] rounded-2xl p-5 sm:p-6 animate-pulse">
                <div className="h-5 bg-[var(--cs-bg-gray)] rounded w-1/3 mb-3" />
                <div className="h-4 bg-[var(--cs-bg-gray)] rounded w-1/2" />
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
                    transition: { staggerChildren: 0.1 },
                },
            }}
            className="space-y-4"
        >
            {groupAddresses.map((addr) => (
                <motion.div
                    key={addr}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 },
                    }}
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
 * Dashboard Page
 * Shows user's groups and allows creating new ones
 */
export default function DashboardPage() {
    const { isConnected, address } = useWallet();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Fetch user groups from contract
    const { data: groupAddresses, isLoading, error, refetch } = useUserGroups(address as Address | undefined);

    // Refetch when address changes or connected
    useEffect(() => {
        if (isConnected && address) {
            refetch();
        }
    }, [isConnected, address, refetch]);

    const groups = (groupAddresses ?? []) as Address[];

    return (
        <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {!isConnected ? (
                    <NotConnectedState />
                ) : isLoading ? (
                    <LoadingState />
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-semibold text-[var(--cs-text-primary)]">
                                    Your Groups
                                </h1>
                                <p className="text-[var(--cs-text-secondary)] mt-1">
                                    Manage your expense groups and balances
                                </p>
                            </div>
                            <div className="flex gap-2 self-start sm:self-auto">
                                <Button
                                    onClick={() => refetch()}
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full w-12 h-12"
                                    title="Refresh groups"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </Button>
                                <Button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="rounded-full px-6 py-5 bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)] text-white"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Group
                                </Button>
                            </div>
                        </div>

                        {/* Error state */}
                        {error && (
                            <div className="bg-[var(--cs-error)]/10 border border-[var(--cs-error)]/30 rounded-xl p-4 mb-6 flex justify-between items-center">
                                <p className="text-[var(--cs-error)]">
                                    Failed to load groups. Please try again.
                                </p>
                                <Button onClick={() => refetch()} variant="outline" size="sm">
                                    Retry
                                </Button>
                            </div>
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
