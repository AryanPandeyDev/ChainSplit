"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Zap, Shield, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAddress, parseUnits } from "viem";
import { useCreateGroup, useWallet } from "@/hooks";

interface CreateGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated?: () => void;
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
    const { address } = useWallet();
    const [mode, setMode] = useState<"direct" | "escrow">("direct");
    const [name, setName] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [requiredDeposit, setRequiredDeposit] = useState("");
    const [depositDeadlineDays, setDepositDeadlineDays] = useState("7");
    const [newMember, setNewMember] = useState("");
    const [members, setMembers] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Contract hook for creating groups
    const { createDirectGroup, createEscrowGroup, isLoading, isSuccess } = useCreateGroup();

    // Reset form helper
    const resetForm = useCallback(() => {
        setName("");
        setTokenAddress("");
        setRequiredDeposit("");
        setDepositDeadlineDays("7");
        setNewMember("");
        setMembers([]);
        setMode("direct");
        setErrors({});
    }, []);

    // Watch for success to close modal and trigger refresh
    useEffect(() => {
        if (isSuccess && open) {
            if (onGroupCreated) {
                onGroupCreated();
            }
            // Small delay to let user see success state
            const timer = setTimeout(() => {
                resetForm();
                onOpenChange(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, open, onGroupCreated, onOpenChange, resetForm]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Group name is required";
        }

        if (!tokenAddress || !isAddress(tokenAddress)) {
            newErrors.tokenAddress = "Invalid token address";
        }

        if (members.length === 0) {
            newErrors.members = "Add at least one other member";
        }

        if (mode === "escrow") {
            if (!requiredDeposit || parseFloat(requiredDeposit) <= 0) {
                newErrors.requiredDeposit = "Required deposit must be greater than 0";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addMember = () => {
        if (newMember && isAddress(newMember) && !members.includes(newMember)) {
            setMembers([...members, newMember]);
            setNewMember("");
            setErrors((prev) => ({ ...prev, members: "" }));
        }
    };

    const removeMember = (memberAddress: string) => {
        setMembers(members.filter((m) => m !== memberAddress));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            // Include current user in members list
            const allMembers = address
                ? [address, ...members.filter((m) => m.toLowerCase() !== address.toLowerCase())]
                : members;

            if (mode === "direct") {
                await createDirectGroup({
                    members: allMembers as `0x${string}`[],
                    tokenAddress: tokenAddress as `0x${string}`,
                });
            } else {
                const depositAmount = parseUnits(requiredDeposit, 6); // Assuming 6 decimals for USDC
                const deadlineDays = parseInt(depositDeadlineDays || "7");
                const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineDays * 24 * 60 * 60);

                await createEscrowGroup({
                    members: allMembers as `0x${string}`[],
                    tokenAddress: tokenAddress as `0x${string}`,
                    requiredDeposit: depositAmount,
                    depositDeadline: deadline,
                });
            }
        } catch (error) {
            console.error("Failed to create group:", error);
            setErrors({ submit: error instanceof Error ? error.message : "Failed to create group" });
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            resetForm();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Group</DialogTitle>
                    <DialogDescription>
                        Set up a new expense group. Choose a settlement mode and add members.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Error display */}
                    {errors.submit && (
                        <div className="bg-[var(--cs-error)]/10 border border-[var(--cs-error)]/30 rounded-xl p-3">
                            <p className="text-sm text-[var(--cs-error)]">{errors.submit}</p>
                        </div>
                    )}

                    {/* Group Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                            Group Name *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Trip to Goa"
                            className="h-12"
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-sm text-[var(--cs-error)]">{errors.name}</p>
                        )}
                    </div>

                    {/* Settlement Mode */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                            Settlement Mode *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMode("direct")}
                                disabled={isLoading}
                                className={cn(
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    mode === "direct"
                                        ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                                        : "border-[var(--cs-border-light)] hover:border-[var(--cs-text-secondary)]",
                                    isLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-5 h-5 text-[var(--cs-accent-green)]" />
                                    <span className="font-medium">Direct</span>
                                </div>
                                <p className="text-xs text-[var(--cs-text-secondary)]">
                                    No deposits. Pull-based settlement.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("escrow")}
                                disabled={isLoading}
                                className={cn(
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    mode === "escrow"
                                        ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                                        : "border-[var(--cs-border-light)] hover:border-[var(--cs-text-secondary)]",
                                    isLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-5 h-5" />
                                    <span className="font-medium">Escrow</span>
                                </div>
                                <p className="text-xs text-[var(--cs-text-secondary)]">
                                    Pre-funded. Auto-settlement.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Token Address */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                            Token Address *
                        </label>
                        <Input
                            value={tokenAddress}
                            onChange={(e) => setTokenAddress(e.target.value)}
                            placeholder="0x..."
                            className="h-12 font-mono text-sm"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-[var(--cs-text-secondary)]">
                            Use the MockUSDC address: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
                        </p>
                        {errors.tokenAddress && (
                            <p className="text-sm text-[var(--cs-error)]">{errors.tokenAddress}</p>
                        )}
                    </div>

                    {/* Escrow-specific fields */}
                    {mode === "escrow" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                                    Required Deposit *
                                </label>
                                <Input
                                    value={requiredDeposit}
                                    onChange={(e) => setRequiredDeposit(e.target.value)}
                                    type="number"
                                    placeholder="100"
                                    className="h-12"
                                    disabled={isLoading}
                                />
                                {errors.requiredDeposit && (
                                    <p className="text-sm text-[var(--cs-error)]">{errors.requiredDeposit}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                                    Deadline (days)
                                </label>
                                <Input
                                    value={depositDeadlineDays}
                                    onChange={(e) => setDepositDeadlineDays(e.target.value)}
                                    type="number"
                                    placeholder="7"
                                    className="h-12"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Members */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                            Members *
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={newMember}
                                onChange={(e) => setNewMember(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addMember();
                                    }
                                }}
                                placeholder="0x... (member address)"
                                className="h-12 font-mono text-sm flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                onClick={addMember}
                                variant="outline"
                                className="h-12 px-4"
                                disabled={isLoading}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Member list */}
                        {members.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {members.map((member) => (
                                    <Badge
                                        key={member}
                                        variant="secondary"
                                        className="py-1.5 px-3 font-mono text-xs flex items-center gap-1"
                                    >
                                        {`${member.slice(0, 6)}...${member.slice(-4)}`}
                                        <button
                                            type="button"
                                            onClick={() => removeMember(member)}
                                            className="ml-1 hover:text-[var(--cs-error)]"
                                            disabled={isLoading}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {members.length === 0 && (
                            <p className="text-sm text-[var(--cs-text-secondary)]">
                                Add at least one other member. Try: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
                            </p>
                        )}
                        {errors.members && (
                            <p className="text-sm text-[var(--cs-error)]">{errors.members}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Group"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
