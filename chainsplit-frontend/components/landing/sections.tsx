"use client";

import { useRef, Suspense, lazy } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    motion,
    useScroll,
    useTransform,
    useInView,
    type Variants,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/ui/background-paths";
import { ArrowRight } from "lucide-react";

const Spline = lazy(() => import("@splinetool/react-spline"));

/* ═══════════════════════════════════════════════════════
   ANIMATION CONFIGS
   ══════════════════════════════════════════════════════ */

const springBounce = { type: "spring" as const, stiffness: 400, damping: 25 };
const springSoft = { type: "spring" as const, stiffness: 120, damping: 20 };
const smoothBezier = [0.22, 1, 0.36, 1] as const;

const wordReveal: Variants = {
    hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
    visible: (i: number) => ({
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
        transition: { delay: i * 0.08, duration: 0.6, ease: smoothBezier },
    }),
};

const blurReveal: Variants = {
    hidden: { filter: "blur(10px)", opacity: 0, y: 10 },
    visible: {
        filter: "blur(0px)",
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: smoothBezier, delay: 0.4 },
    },
};

const tiltIn: Variants = {
    hidden: { rotateX: 8, translateY: 60, opacity: 0 },
    visible: (i: number) => ({
        rotateX: 0,
        translateY: 0,
        opacity: 1,
        transition: { ...springSoft, delay: i * 0.15 },
    }),
};

const slideUp: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: (i: number) => ({
        y: 0,
        opacity: 1,
        transition: { ...springSoft, delay: i * 0.1 },
    }),
};

/* ═══════════════════════════════════════════════════════
   UTILITY: Animated word reveal
   ══════════════════════════════════════════════════════ */

function AnimatedWords({ text, className }: { text: string; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });
    const words = text.split(" ");

    return (
        <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.3em] ${className ?? ""}`}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    custom={i}
                    variants={wordReveal}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    className="inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}

/* ═══════════════════════════════════════════════════════
   CSS-BASED VISUAL ELEMENTS (3D-like renders)
   ══════════════════════════════════════════════════════ */

function HeroVisual() {
    return (
        <div className="relative w-full aspect-square max-w-2xl mx-auto">
            <Suspense
                fallback={
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
                }
            >
                <Spline scene="https://prod.spline.design/uSCYxUvR71qA86-h/scene.splinecode" />
            </Suspense>
        </div>
    );
}

function FeatureImage({ src, alt }: { src: string; alt: string }) {
    return (
        <div className="relative w-full aspect-[4/3] overflow-hidden">
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 1: HERO
   Full viewport, massive serif + sans headline
   ══════════════════════════════════════════════════════ */

export function HeroSection() {
    return (
        <section className="min-h-[calc(100vh-64px)] flex items-center py-16 lg:py-0 relative overflow-hidden">
            {/* Animated background paths — lines only */}
            <div className="absolute bottom-0 left-0 w-[80%] h-[80%] pointer-events-none opacity-30">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
                    {/* Text — massive mixed serif/sans headline */}
                    <div className="lg:pr-8">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springSoft, delay: 0.1 }}
                            className="mb-6"
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border border-[var(--ld-border)] text-[var(--ld-text-muted)] bg-[var(--ld-surface)]">
                                Decentralized Finance
                            </span>
                        </motion.div>

                        <h1 className="mb-8">
                            <span className="block text-[clamp(3rem,7vw,6rem)] leading-[1] font-bold tracking-tight font-[family-name:var(--font-serif)]">
                                <AnimatedWords text="It's now way easier" />
                            </span>
                            <span className="block text-[clamp(3rem,7vw,6rem)] leading-[1] tracking-tight italic text-[var(--ld-text-muted)] font-[family-name:var(--font-serif)]">
                                <AnimatedWords text="to split expenses." />
                            </span>
                        </h1>

                        <motion.p
                            variants={blurReveal}
                            initial="hidden"
                            animate="visible"
                            className="text-lg lg:text-xl text-[var(--ld-text-muted)] max-w-md leading-relaxed mb-10"
                        >
                            ChainSplit brings trustless expense splitting to Web3.
                            Create groups, log expenses, and settle payments
                            with transparent on-chain transactions.
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springBounce, delay: 0.7 }}
                        >
                            <Link href="/dashboard">
                                <Button
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-base bg-white text-[#050505] font-semibold hover:bg-gray-200 transition-all hover:scale-[1.03] active:scale-[0.98]"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="#how-it-works">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-base text-[var(--ld-text-muted)] border border-[var(--ld-border)] hover:border-[var(--ld-border-hover)] hover:text-[var(--ld-text)] hover:bg-[var(--ld-surface)]"
                                >
                                    Learn more
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Visual — 3D-like orb */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, filter: "blur(30px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 1.2, ease: smoothBezier, delay: 0.2 }}
                    >
                        <HeroVisual />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 2: WHAT MAKES US UNIQUE — Bento grid cards
   ══════════════════════════════════════════════════════ */

export function SettlementModesSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-15%" });

    const features = [
        {
            title: "Direct Mode",
            desc: "No deposits required. Payer pulls funds directly from participants via transferFrom. Fast, trustless, minimal overhead.",
            image: "/direct_mode.png",
            span: "md:col-span-1",
        },
        {
            title: "Escrow Mode",
            desc: "Pre-fund a shared pot. Expenses auto-settle from the pool. Maximum security for larger groups with unanimous close.",
            image: "/escrow_mode.png",
            span: "md:col-span-1",
        },
        {
            title: "On-Chain Receipts",
            desc: "Every expense is logged on-chain with optional IPFS receipt attachments. Full transparency, full auditability.",
            image: "/on_chain_reciepts.png",
            span: "md:col-span-1",
        },
        {
            title: "Trustless Settlement",
            desc: "Smart contracts handle all fund movements. No intermediaries, no custodians, no counterparty risk.",
            image: "/trustless_settlement.png",
            span: "md:col-span-1",
        },
    ];

    return (
        <section className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section heading — mixed serif */}
                <div className="mb-16 max-w-3xl">
                    <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-tight mb-6 font-[family-name:var(--font-serif)]">
                        <AnimatedWords text="What makes us" />
                        <br />
                        <span className="italic text-[var(--ld-text-muted)]">
                            <AnimatedWords text="unique." />
                        </span>
                    </h2>
                </div>

                {/* Bento grid */}
                <div
                    ref={ref}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    style={{ perspective: "1200px" }}
                >
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            custom={i}
                            variants={tiltIn}
                            initial="hidden"
                            animate={isInView ? "visible" : "hidden"}
                            className={`${f.span} rounded-2xl overflow-hidden border border-[var(--ld-border)] bg-[var(--ld-surface)] hover:bg-[var(--ld-surface-hover)] hover:border-[var(--ld-border-hover)] transition-all duration-300 group`}
                        >
                            {/* Visual */}
                            <FeatureImage src={f.image} alt={f.title} />
                            {/* Content */}
                            <div className="p-6 lg:p-8">
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-[var(--ld-text-muted)] leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 3: BIG CENTERED TEXT STATEMENTS
   Like the reference's "Censorship-free / Algorithm-free"
   ══════════════════════════════════════════════════════ */

function TextStatements() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-15%" });

    const statements = [
        { text: "Fully on-chain", muted: false },
        { text: "Trustless settlement", muted: true },
        { text: "No intermediaries", muted: false },
        { text: "Transparent & verifiable", muted: true },
        { text: "100% non-custodial", muted: false },
    ];

    return (
        <section className="py-24 lg:py-40 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[var(--ld-border)] to-transparent" />

            <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-2">
                {statements.map((s, i) => (
                    <motion.p
                        key={i}
                        custom={i}
                        variants={slideUp}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        className={`text-[clamp(1.8rem,4.5vw,3.5rem)] leading-[1.3] tracking-tight font-[family-name:var(--font-serif)] ${s.muted ? "text-[var(--ld-text-muted)] italic" : "text-[var(--ld-text)] font-bold"
                            }`}
                    >
                        {s.text}
                    </motion.p>
                ))}
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 4: HOW IT WORKS — 3 step process
   ══════════════════════════════════════════════════════ */

export function HowItWorksSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-15%" });

    const steps = [
        {
            number: "01",
            title: "Create a group",
            description: "Add members and choose Direct or Escrow mode based on your trust level and use case.",
        },
        {
            number: "02",
            title: "Log expenses",
            description: "Record expenses with split amounts. Optionally attach receipts stored on IPFS.",
        },
        {
            number: "03",
            title: "Settle on-chain",
            description: "Expenses are settled transparently on the blockchain. Every transaction is verifiable.",
        },
    ];

    return (
        <>
            {/* Big text statements section first */}
            <TextStatements />

            <section id="how-it-works" className="py-24 lg:py-32 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[var(--ld-border)] to-transparent" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-20 max-w-3xl">
                        <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-tight font-[family-name:var(--font-serif)]">
                            <AnimatedWords text="How it" />
                            <br />
                            <span className="italic text-[var(--ld-text-muted)]">
                                <AnimatedWords text="works." />
                            </span>
                        </h2>
                    </div>

                    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                custom={i}
                                variants={slideUp}
                                initial="hidden"
                                animate={isInView ? "visible" : "hidden"}
                                className="relative p-8 rounded-2xl border border-[var(--ld-border)] bg-[var(--ld-surface)] group hover:border-[var(--ld-border-hover)] transition-colors"
                            >
                                <span className="block text-6xl font-[family-name:var(--font-serif)] text-[rgba(255,255,255,0.06)] mb-4 select-none">
                                    {step.number}
                                </span>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-[var(--ld-text-muted)] leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 5: PROVEN FEATURES — showcase cards with visuals
   ══════════════════════════════════════════════════════ */

function ProvenFeatures() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-15%" });

    return (
        <section className="py-24 lg:py-32 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[var(--ld-border)] to-transparent" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-tight font-[family-name:var(--font-serif)]">
                        <AnimatedWords text="Proven" />
                        {" "}
                        <span className="italic text-[var(--ld-text-muted)]">
                            <AnimatedWords text="features." />
                        </span>
                    </h2>
                </div>

                <div ref={ref} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Large feature card */}
                    <motion.div
                        custom={0}
                        variants={slideUp}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        className="lg:col-span-2 rounded-2xl border border-[var(--ld-border)] bg-[var(--ld-surface)] overflow-hidden group hover:border-[var(--ld-border-hover)] transition-colors"
                    >
                        <div className="relative h-64 overflow-hidden">
                            <Image
                                src="/smart_expense_management.png"
                                alt="Smart Expense Management"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-8">
                            <h3 className="text-2xl font-bold mb-3">Smart Expense Management</h3>
                            <p className="text-[var(--ld-text-muted)] leading-relaxed max-w-lg">
                                Create, track, and settle group expenses with smart contract automation.
                                Every transaction is transparent, immutable, and verifiable on-chain.
                            </p>
                        </div>
                    </motion.div>

                    {/* Stacked feature cards */}
                    <div className="flex flex-col gap-5">
                        <motion.div
                            custom={1}
                            variants={slideUp}
                            initial="hidden"
                            animate={isInView ? "visible" : "hidden"}
                            className="flex-1 rounded-2xl border border-[var(--ld-border)] bg-[var(--ld-surface)] p-6 hover:border-[var(--ld-border-hover)] transition-colors relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl" />
                            <h3 className="text-lg font-bold mb-2 relative z-10">IPFS Receipts</h3>
                            <p className="text-sm text-[var(--ld-text-muted)] leading-relaxed relative z-10">
                                Attach receipts stored permanently on IPFS. Decentralized proof of every expense.
                            </p>
                        </motion.div>

                        <motion.div
                            custom={2}
                            variants={slideUp}
                            initial="hidden"
                            animate={isInView ? "visible" : "hidden"}
                            className="flex-1 rounded-2xl border border-[var(--ld-border)] bg-[var(--ld-surface)] p-6 hover:border-[var(--ld-border-hover)] transition-colors relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl" />
                            <h3 className="text-lg font-bold mb-2 relative z-10">ERC-20 Support</h3>
                            <p className="text-sm text-[var(--ld-text-muted)] leading-relaxed relative z-10">
                                Use any ERC-20 token for group expenses. USDC, DAI, or your own token — your choice.
                            </p>
                        </motion.div>

                        <motion.div
                            custom={3}
                            variants={slideUp}
                            initial="hidden"
                            animate={isInView ? "visible" : "hidden"}
                            className="flex-1 rounded-2xl border border-[var(--ld-border)] bg-[var(--ld-surface)] p-6 hover:border-[var(--ld-border-hover)] transition-colors relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
                            <h3 className="text-lg font-bold mb-2 relative z-10">Multi-Chain Ready</h3>
                            <p className="text-sm text-[var(--ld-text-muted)] leading-relaxed relative z-10">
                                Deploy on any EVM-compatible chain. Ethereum, Polygon, Arbitrum, and more.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 6: CTA — parallax depth
   ══════════════════════════════════════════════════════ */

export function CTASection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const yHeading = useTransform(scrollYProgress, [0, 1], [40, -40]);
    const ySubtext = useTransform(scrollYProgress, [0, 1], [20, -20]);
    const yButton = useTransform(scrollYProgress, [0, 1], [60, -10]);

    return (
        <>
            <ProvenFeatures />

            <section ref={ref} className="py-24 lg:py-40 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[var(--ld-border)] to-transparent" />

                {/* Background glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[800px] h-[400px] rounded-full opacity-[0.06] blur-[120px]"
                        style={{ background: "linear-gradient(135deg, rgba(140,100,255,0.8), rgba(80,200,200,0.5))" }}
                    />
                </div>

                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.h2
                        style={{ y: yHeading }}
                        className="text-[clamp(2.5rem,6vw,5rem)] leading-[1.1] tracking-tight mb-6 font-[family-name:var(--font-serif)]"
                    >
                        Start splitting
                        <br />
                        <span className="italic text-[var(--ld-text-muted)]">smarter.</span>
                    </motion.h2>

                    <motion.p
                        style={{ y: ySubtext }}
                        className="text-lg lg:text-xl text-[var(--ld-text-muted)] max-w-lg mx-auto mb-10 leading-relaxed"
                    >
                        Join the future of transparent group settlements.
                        Connect your wallet and create your first group in minutes.
                    </motion.p>

                    <motion.div style={{ y: yButton }}>
                        <Link href="/dashboard">
                            <Button
                                size="lg"
                                className="rounded-full px-10 py-7 text-lg font-semibold bg-white text-[#050505] hover:bg-gray-200 transition-all hover:scale-[1.03] active:scale-[0.98]"
                            >
                                Launch App
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
