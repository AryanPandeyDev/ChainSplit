"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Plus,
    Users,
    Receipt,
    Wallet,
    Settings,
    Copy,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tab content components
function OverviewTab() {
    // Mock data - will be replaced with contract reads
    const members = [
        { address: "0x1234...5678", balance: 45.0 },
        { address: "0xabcd...efgh", balance: -30.0 },
        { address: "0x9876...5432", balance: -15.0 },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Total Expenses</p>
                    <p className="text-2xl font-semibold mt-1">$350.00</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Your Balance</p>
                    <p className="text-2xl font-semibold mt-1 text-[var(--cs-accent-green)]">+$45.00</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Pending</p>
                    <p className="text-2xl font-semibold mt-1">2</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[var(--cs-border-light)]">
                    <p className="text-sm text-[var(--cs-text-secondary)]">Settled</p>
                    <p className="text-2xl font-semibold mt-1">5</p>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] overflow-hidden">
                <div className="p-4 border-b border-[var(--cs-border-light)]">
                    <h3 className="font-semibold">Members</h3>
                </div>
                <div className="divide-y divide-[var(--cs-border-light)]">
                    {members.map((member) => (
                        <div key={member.address} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--cs-bg-gray)] flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[var(--cs-text-secondary)]" />
                                </div>
                                <span className="font-mono text-sm">{member.address}</span>
                            </div>
                            <span className={cn(
                                "font-semibold",
                                member.balance >= 0 ? "text-[var(--cs-accent-green)]" : "text-[var(--cs-error)]"
                            )}>
                                {member.balance >= 0 ? "+" : ""}{member.balance.toFixed(2)} USDC
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ExpensesTab({ groupId }: { groupId: string }) {
    // Mock expenses - will be replaced with contract reads
    const expenses = [
        { id: 1, payer: "0x1234...5678", amount: 100, description: "Dinner", state: "settled" },
        { id: 2, payer: "0xabcd...efgh", amount: 50, description: "Uber", state: "pending" },
        { id: 3, payer: "0x1234...5678", amount: 200, description: "Hotel", state: "pending" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">All Expenses</h3>
                <Link href={`/groups/${groupId}/expense/new`}>
                    <Button size="sm" className="rounded-full bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Expense
                    </Button>
                </Link>
            </div>

            <div className="space-y-3">
                {expenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="bg-white rounded-xl border border-[var(--cs-border-light)] p-4 flex items-center justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{expense.description}</span>
                                <Badge
                                    variant={expense.state === "settled" ? "default" : "outline"}
                                    className={cn(
                                        "text-xs",
                                        expense.state === "settled"
                                            ? "bg-[var(--cs-success)] text-white"
                                            : "border-[var(--cs-warning)] text-[var(--cs-warning)]"
                                    )}
                                >
                                    {expense.state}
                                </Badge>
                            </div>
                            <p className="text-sm text-[var(--cs-text-secondary)]">
                                Paid by {expense.payer}
                            </p>
                        </div>
                        <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DepositsTab() {
    // For Escrow mode only
    const deposits = [
        { address: "0x1234...5678", deposited: true, amount: 100 },
        { address: "0xabcd...efgh", deposited: true, amount: 100 },
        { address: "0x9876...5432", deposited: false, amount: 0 },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-[var(--cs-bg-gray)] rounded-xl p-4">
                <p className="text-sm text-[var(--cs-text-secondary)]">Required Deposit</p>
                <p className="text-2xl font-semibold">100.00 USDC</p>
            </div>

            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] overflow-hidden">
                <div className="p-4 border-b border-[var(--cs-border-light)]">
                    <h3 className="font-semibold">Deposit Status</h3>
                </div>
                <div className="divide-y divide-[var(--cs-border-light)]">
                    {deposits.map((deposit) => (
                        <div key={deposit.address} className="p-4 flex items-center justify-between">
                            <span className="font-mono text-sm">{deposit.address}</span>
                            <Badge variant={deposit.deposited ? "default" : "outline"}>
                                {deposit.deposited ? "Deposited" : "Pending"}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ groupAddress }: { groupAddress: string }) {
    const copyAddress = () => {
        navigator.clipboard.writeText(groupAddress);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-4">
                <h3 className="font-semibold mb-4">Group Contract</h3>
                <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[var(--cs-bg-gray)] px-3 py-2 rounded-lg text-sm font-mono">
                        {groupAddress}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyAddress}>
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                        <a href={`https://etherscan.io/address/${groupAddress}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * Group Detail Page
 */
export default function GroupDetailPage() {
    const params = useParams();
    const groupId = params.id as string;
    const [activeTab, setActiveTab] = useState("overview");

    // Mock group data - will be replaced with contract reads
    const group = {
        name: "Trip to Goa",
        mode: "direct" as const,
        memberCount: 3,
        tokenSymbol: "USDC",
        createdAt: "Jan 15, 2026",
    };

    const isEscrow = group.mode === "escrow";

    return (
        <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
            <Navbar />

            <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold text-[var(--cs-text-primary)]">
                                {group.name}
                            </h1>
                            <Badge
                                variant={group.mode === "direct" ? "default" : "outline"}
                                className={cn(
                                    "rounded-full",
                                    group.mode === "direct"
                                        ? "bg-[var(--cs-card-dark)]"
                                        : ""
                                )}
                            >
                                {group.mode === "direct" ? "Direct" : "Escrow"}
                            </Badge>
                        </div>
                        <p className="text-[var(--cs-text-secondary)] mt-1">
                            Created {group.createdAt} · {group.memberCount} members
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start bg-transparent border-b border-[var(--cs-border-light)] rounded-none p-0 h-auto mb-6">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="expenses"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            Expenses
                        </TabsTrigger>
                        {isEscrow && (
                            <TabsTrigger
                                value="deposits"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Deposits
                            </TabsTrigger>
                        )}
                        <TabsTrigger
                            value="settings"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--cs-accent-green)] data-[state=active]:bg-transparent px-4 py-3"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TabsContent value="overview" className="mt-0">
                                <OverviewTab />
                            </TabsContent>
                            <TabsContent value="expenses" className="mt-0">
                                <ExpensesTab groupId={groupId} />
                            </TabsContent>
                            {isEscrow && (
                                <TabsContent value="deposits" className="mt-0">
                                    <DepositsTab />
                                </TabsContent>
                            )}
                            <TabsContent value="settings" className="mt-0">
                                <SettingsTab groupAddress={groupId} />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </main>
        </div>
    );
}
