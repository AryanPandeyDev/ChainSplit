"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Upload,
    X,
    Loader2,
    Check,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Form validation schema
const addExpenseSchema = z.object({
    amount: z.string().min(1, "Amount is required").refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Amount must be greater than 0"
    ),
    description: z.string().min(1, "Description is required").max(100),
});

type AddExpenseFormData = z.infer<typeof addExpenseSchema>;

interface Participant {
    address: string;
    share: number;
    selected: boolean;
}

/**
 * Participant chip with editable share
 */
function ParticipantChip({
    participant,
    tokenSymbol,
    onToggle,
    onShareChange,
}: {
    participant: Participant;
    tokenSymbol: string;
    onToggle: () => void;
    onShareChange: (share: number) => void;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border-2 p-3 transition-all cursor-pointer",
                participant.selected
                    ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                    : "border-[var(--cs-border-light)] opacity-60"
            )}
            onClick={onToggle}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            participant.selected
                                ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]"
                                : "border-[var(--cs-border-light)]"
                        )}
                    >
                        {participant.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-mono text-sm">
                        {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                    </span>
                </div>
            </div>
            {participant.selected && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-sm text-[var(--cs-text-secondary)]">$</span>
                    <Input
                        type="number"
                        value={participant.share}
                        onChange={(e) => onShareChange(parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 text-sm"
                        step="0.01"
                    />
                    <span className="text-sm text-[var(--cs-text-secondary)]">{tokenSymbol}</span>
                </div>
            )}
        </div>
    );
}

/**
 * File upload dropzone
 */
function FileUpload({
    file,
    onFileSelect,
    onRemove,
}: {
    file: File | null;
    onFileSelect: (file: File) => void;
    onRemove: () => void;
}) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile && droppedFile.type.startsWith("image/")) {
                onFileSelect(droppedFile);
            }
        },
        [onFileSelect]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            onFileSelect(selectedFile);
        }
    };

    if (file) {
        return (
            <div className="relative rounded-xl border border-[var(--cs-border-light)] p-4 bg-[var(--cs-bg-gray)]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                        <Upload className="w-6 h-6 text-[var(--cs-accent-green)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-[var(--cs-text-secondary)]">
                            {(file.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="hover:text-[var(--cs-error)]"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                isDragging
                    ? "border-[var(--cs-accent-green)] bg-[var(--cs-accent-green)]/5"
                    : "border-[var(--cs-border-light)]"
            )}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <Upload className="w-10 h-10 text-[var(--cs-text-secondary)] mx-auto mb-3" />
            <p className="text-[var(--cs-text-secondary)] mb-2">
                Drop file or{" "}
                <label className="text-[var(--cs-accent-green)] cursor-pointer hover:underline">
                    click to upload
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleChange}
                    />
                </label>
            </p>
            <p className="text-xs text-[var(--cs-text-secondary)]">
                PNG, JPG up to 5MB
            </p>
        </div>
    );
}

/**
 * Expense preview card
 */
function ExpensePreview({
    amount,
    selectedParticipants,
    tokenSymbol,
    userAddress,
}: {
    amount: number;
    selectedParticipants: Participant[];
    tokenSymbol: string;
    userAddress: string;
}) {
    const userShare = selectedParticipants.find(
        (p) => p.address.toLowerCase() === userAddress.toLowerCase()
    )?.share || 0;

    const othersOwe = selectedParticipants
        .filter((p) => p.address.toLowerCase() !== userAddress.toLowerCase())
        .reduce((sum, p) => sum + p.share, 0);

    return (
        <div className="bg-[var(--cs-bg-gray)] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[var(--cs-text-secondary)] mb-3">
                PREVIEW
            </h3>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-semibold">${amount.toFixed(2)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--cs-text-secondary)]">You pay</span>
                    <span>${userShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--cs-text-secondary)]">Others owe you</span>
                    <span className="text-[var(--cs-accent-green)]">${othersOwe.toFixed(2)}</span>
                </div>
                <div className="border-t border-[var(--cs-border-light)] pt-2 mt-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-[var(--cs-text-secondary)]">Est. gas</span>
                        <span>~0.002 ETH</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Add Expense Page
 */
export default function AddExpensePage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id as string;

    // Mock data - will be replaced with contract reads
    const mockMembers = [
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "0x9876543210987654321098765432109876543210",
    ];
    const tokenSymbol = "USDC";
    const userAddress = mockMembers[0];

    const [participants, setParticipants] = useState<Participant[]>(
        mockMembers.map((addr) => ({
            address: addr,
            share: 0,
            selected: true,
        }))
    );
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<AddExpenseFormData>({
        resolver: zodResolver(addExpenseSchema),
    });

    const amount = parseFloat(watch("amount") || "0");

    // Auto-split equally when amount changes
    const splitEqually = () => {
        const selected = participants.filter((p) => p.selected);
        if (selected.length === 0 || amount <= 0) return;

        const share = amount / selected.length;
        setParticipants(
            participants.map((p) => ({
                ...p,
                share: p.selected ? parseFloat(share.toFixed(2)) : 0,
            }))
        );
    };

    const toggleParticipant = (address: string) => {
        setParticipants(
            participants.map((p) =>
                p.address === address ? { ...p, selected: !p.selected, share: 0 } : p
            )
        );
    };

    const updateShare = (address: string, share: number) => {
        setParticipants(
            participants.map((p) => (p.address === address ? { ...p, share } : p))
        );
    };

    const selectedParticipants = participants.filter((p) => p.selected);
    const totalShares = selectedParticipants.reduce((sum, p) => sum + p.share, 0);
    const sharesMatch = Math.abs(totalShares - amount) < 0.01;

    const onSubmit = async (data: AddExpenseFormData) => {
        if (!sharesMatch) return;

        setIsSubmitting(true);

        // TODO: Upload receipt to IPFS via /api/pin
        // TODO: Call contract to create expense
        console.log("Creating expense:", {
            ...data,
            participants: selectedParticipants,
            receipt: receiptFile,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        router.push(`/groups/${groupId}`);
    };

    return (
        <div className="min-h-screen bg-[var(--cs-bg-offwhite)]">
            <Navbar />

            <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <Link
                    href={`/groups/${groupId}`}
                    className="inline-flex items-center gap-2 text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Group
                </Link>

                <h1 className="text-3xl font-semibold text-[var(--cs-text-primary)] mb-8">
                    Add Expense
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Amount */}
                    <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-5">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)] mb-3 block">
                            Amount *
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl text-[var(--cs-text-secondary)]">$</span>
                            <Input
                                {...register("amount")}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="text-3xl font-semibold h-14 border-0 shadow-none focus-visible:ring-0 p-0"
                            />
                            <Badge variant="outline" className="text-sm">
                                {tokenSymbol}
                            </Badge>
                        </div>
                        {errors.amount && (
                            <p className="text-sm text-[var(--cs-error)] mt-2">{errors.amount.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-5">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)] mb-3 block">
                            Description *
                        </label>
                        <Input
                            {...register("description")}
                            placeholder="e.g., Dinner at restaurant"
                            className="h-12"
                        />
                        {errors.description && (
                            <p className="text-sm text-[var(--cs-error)] mt-2">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Split between */}
                    <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-5">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-[var(--cs-text-primary)]">
                                Split between *
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={splitEqually}
                                className="text-[var(--cs-accent-green)] hover:text-[var(--cs-accent-green-hover)]"
                            >
                                Split equally
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {participants.map((participant) => (
                                <ParticipantChip
                                    key={participant.address}
                                    participant={participant}
                                    tokenSymbol={tokenSymbol}
                                    onToggle={() => toggleParticipant(participant.address)}
                                    onShareChange={(share) => updateShare(participant.address, share)}
                                />
                            ))}
                        </div>
                        {amount > 0 && !sharesMatch && (
                            <div className="flex items-center gap-2 mt-4 text-[var(--cs-warning)] text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>
                                    Shares total ${totalShares.toFixed(2)}, but expense is ${amount.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Receipt */}
                    <div className="bg-white rounded-xl border border-[var(--cs-border-light)] p-5">
                        <label className="text-sm font-medium text-[var(--cs-text-primary)] mb-3 block">
                            Receipt (optional)
                        </label>
                        <FileUpload
                            file={receiptFile}
                            onFileSelect={setReceiptFile}
                            onRemove={() => setReceiptFile(null)}
                        />
                    </div>

                    {/* Preview */}
                    {amount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <ExpensePreview
                                amount={amount}
                                selectedParticipants={selectedParticipants}
                                tokenSymbol={tokenSymbol}
                                userAddress={userAddress}
                            />
                        </motion.div>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isSubmitting || !sharesMatch || amount <= 0}
                        className="w-full h-14 rounded-xl text-base bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Expense"
                        )}
                    </Button>
                </form>
            </main>
        </div>
    );
}
