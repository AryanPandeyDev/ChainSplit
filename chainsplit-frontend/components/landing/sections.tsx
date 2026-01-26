"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Shield, ChevronRight } from "lucide-react";

// Animation variants
const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] },
};

const staggerContainer = {
    animate: {
        transition: { staggerChildren: 0.1 },
    },
};

/**
 * Hero Section - 60/40 split layout
 */
export function HeroSection() {
    return (
        <section className="min-h-[calc(100vh-64px)] flex items-center py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
                    {/* Left content - 60% */}
                    <motion.div
                        className="lg:col-span-3"
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                    >
                        <motion.h1
                            variants={fadeUp}
                            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[var(--cs-text-primary)] leading-[1.1] tracking-tight"
                        >
                            Split expenses.
                            <br />
                            <span className="relative">
                                Settle on-chain.
                                <span className="absolute -right-3 -top-3 w-6 h-6 bg-[var(--cs-accent-green)] rounded-full opacity-60" />
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            className="mt-6 text-lg text-[var(--cs-text-secondary)] max-w-xl"
                        >
                            ChainSplit brings trustless expense splitting to Web3. Create groups,
                            log expenses, and settle payments with transparent on-chain transactions.
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            className="mt-8 flex flex-col sm:flex-row gap-4"
                        >
                            <Link href="/dashboard">
                                <Button
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-base bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)] text-white transition-all hover:scale-[1.02]"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="#how-it-works">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-base text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] underline-offset-4 hover:underline"
                                >
                                    Learn how it works
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right illustration - 40% */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="relative aspect-square max-w-md mx-auto">
                            {/* Abstract illustration with green accents */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--cs-bg-gray)] to-white rounded-3xl" />

                            {/* Chain links illustration */}
                            <svg
                                viewBox="0 0 400 400"
                                className="absolute inset-0 w-full h-full p-8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Connection lines */}
                                <path
                                    d="M100 200 L200 100 L300 200 L200 300 Z"
                                    stroke="var(--cs-text-primary)"
                                    strokeWidth="2"
                                    fill="none"
                                />
                                <path
                                    d="M150 150 L250 150 L250 250 L150 250 Z"
                                    stroke="var(--cs-text-primary)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    fill="none"
                                />

                                {/* Nodes */}
                                <circle cx="100" cy="200" r="24" fill="var(--cs-card-dark)" />
                                <circle cx="200" cy="100" r="24" fill="var(--cs-card-dark)" />
                                <circle cx="300" cy="200" r="24" fill="var(--cs-accent-green)" />
                                <circle cx="200" cy="300" r="24" fill="var(--cs-card-dark)" />

                                {/* Center node */}
                                <circle cx="200" cy="200" r="32" fill="var(--cs-accent-green)" />
                                <text x="200" y="208" textAnchor="middle" fill="var(--cs-text-primary)" fontWeight="600" fontSize="24">
                                    $
                                </text>

                                {/* Small accent dots */}
                                <circle cx="150" cy="150" r="8" fill="var(--cs-accent-green)" opacity="0.6" />
                                <circle cx="250" cy="250" r="8" fill="var(--cs-accent-green)" opacity="0.6" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/**
 * Settlement Modes Section - Direct and Escrow cards
 */
export function SettlementModesSection() {
    return (
        <section className="py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                >
                    <h2 className="text-3xl lg:text-4xl font-semibold text-[var(--cs-text-primary)] mb-12">
                        Two ways to settle
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Direct Mode - Dark Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-[var(--cs-card-dark)] text-white rounded-2xl p-8 lg:p-10 min-h-[320px] flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-shadow"
                    >
                        <div className="relative z-10">
                            <h3 className="text-2xl font-semibold mb-4">Direct Mode</h3>
                            <p className="text-gray-300 leading-relaxed">
                                No deposits needed. When an expense is accepted, the payer pulls
                                funds directly from participants via <code className="text-[var(--cs-accent-green)]">transferFrom</code>.
                                Perfect for trusted groups.
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-6 relative z-10">
                            <div className="flex items-center gap-2 text-[var(--cs-accent-green)]">
                                <Zap className="w-6 h-6" />
                                <span className="text-sm font-medium">Pull-based</span>
                            </div>
                            <Link
                                href="/docs/direct-mode"
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                            >
                                Learn more
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Background accent */}
                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[var(--cs-accent-green)] rounded-full opacity-10 group-hover:opacity-20 transition-opacity" />
                    </motion.div>

                    {/* Escrow Mode - Light Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="bg-white border border-[var(--cs-border-light)] rounded-2xl p-8 lg:p-10 min-h-[320px] flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-shadow"
                    >
                        <div className="relative z-10">
                            <h3 className="text-2xl font-semibold text-[var(--cs-text-primary)] mb-4">
                                Escrow Mode
                            </h3>
                            <p className="text-[var(--cs-text-secondary)] leading-relaxed">
                                Pre-fund a shared pot. Expenses automatically settle from the pool.
                                Withdraw after unanimous group close. Maximum security for larger groups.
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-6 relative z-10">
                            <div className="flex items-center gap-2 text-[var(--cs-text-primary)]">
                                <Shield className="w-6 h-6" />
                                <span className="text-sm font-medium">Pre-funded</span>
                            </div>
                            <Link
                                href="/docs/escrow-mode"
                                className="text-sm text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] flex items-center gap-1 transition-colors"
                            >
                                Learn more
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Background accent */}
                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[var(--cs-bg-gray)] rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/**
 * How It Works Section - 3-step process
 */
export function HowItWorksSection() {
    const steps = [
        {
            number: "01",
            title: "Create a group",
            description: "Add members and choose Direct or Escrow mode based on your trust level and use case.",
            icon: Users,
        },
        {
            number: "02",
            title: "Log expenses",
            description: "Record expenses with split amounts. Optionally attach receipts stored on IPFS.",
            icon: Zap,
        },
        {
            number: "03",
            title: "Settle on-chain",
            description: "Expenses are settled transparently on the blockchain. Every transaction is verifiable.",
            icon: Shield,
        },
    ];

    return (
        <section id="how-it-works" className="py-20 lg:py-28 bg-[var(--cs-bg-gray)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl lg:text-4xl font-semibold text-[var(--cs-text-primary)]">
                        How ChainSplit works
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="bg-white rounded-2xl p-8 relative"
                        >
                            <span className="text-4xl font-bold text-[var(--cs-accent-green)]">
                                {step.number}
                            </span>
                            <h3 className="text-xl font-semibold text-[var(--cs-text-primary)] mt-4 mb-3">
                                {step.title}
                            </h3>
                            <p className="text-[var(--cs-text-secondary)]">
                                {step.description}
                            </p>
                            <step.icon className="absolute right-6 bottom-6 w-10 h-10 text-[var(--cs-bg-gray)]" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * CTA Section - Final call to action
 */
export function CTASection() {
    return (
        <section className="py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="bg-[var(--cs-bg-gray)] rounded-3xl p-10 lg:p-16 relative overflow-hidden"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-semibold text-[var(--cs-text-primary)] mb-4">
                                Ready to split smarter?
                            </h2>
                            <p className="text-[var(--cs-text-secondary)] text-lg mb-8 max-w-md">
                                Join the future of transparent group settlements. Connect your wallet
                                and create your first group in minutes.
                            </p>
                            <Link href="/dashboard">
                                <Button
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-base bg-[var(--cs-card-dark)] hover:bg-[var(--cs-card-dark-secondary)] text-white transition-all hover:scale-[1.02]"
                                >
                                    Launch App
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>

                        {/* Decorative elements */}
                        <div className="hidden lg:flex justify-center items-center relative">
                            <div className="w-24 h-24 bg-[var(--cs-accent-green)] rounded-full opacity-80" />
                            <div className="absolute w-16 h-16 bg-[var(--cs-card-dark)] rounded-full -translate-x-12 -translate-y-6" />
                            <div className="absolute w-8 h-8 bg-[var(--cs-accent-green)] rounded-full translate-x-16 translate-y-10 opacity-60" />
                        </div>
                    </div>

                    {/* Background accent */}
                    <div className="absolute -right-20 -top-20 w-60 h-60 bg-[var(--cs-accent-green)] rounded-full opacity-10" />
                </motion.div>
            </div>
        </section>
    );
}
