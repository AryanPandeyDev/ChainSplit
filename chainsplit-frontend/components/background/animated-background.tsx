"use client";

import { motion } from "framer-motion";

/**
 * Animated floating shapes for background visual interest
 */
export function FloatingShapes() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Large gradient blob - top right */}
            <motion.div
                className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(168, 255, 0, 0.15) 0%, rgba(168, 255, 0, 0) 70%)",
                }}
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Medium blob - left side */}
            <motion.div
                className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(26, 26, 26, 0.05) 0%, rgba(26, 26, 26, 0) 70%)",
                }}
                animate={{
                    x: [0, 20, 0],
                    y: [0, 30, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Small accent circle - floating */}
            <motion.div
                className="absolute top-1/3 right-1/4 w-4 h-4 bg-[var(--cs-accent-green)] rounded-full opacity-40"
                animate={{
                    y: [0, -30, 0],
                    x: [0, 15, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Small dark circle - floating */}
            <motion.div
                className="absolute top-2/3 left-1/4 w-6 h-6 bg-[var(--cs-card-dark)] rounded-full opacity-10"
                animate={{
                    y: [0, 20, 0],
                    x: [0, -10, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
            />

            {/* Tiny accent dots scattered */}
            <motion.div
                className="absolute top-1/2 right-1/3 w-2 h-2 bg-[var(--cs-accent-green)] rounded-full opacity-60"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-1/4 left-1/3 w-3 h-3 bg-[var(--cs-accent-green)] rounded-full opacity-30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/2 w-2 h-2 bg-[var(--cs-card-dark)] rounded-full opacity-20"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
        </div>
    );
}

/**
 * Subtle grid pattern background
 */
export function GridPattern() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
            style={{
                backgroundImage: `
          linear-gradient(to right, var(--cs-text-primary) 1px, transparent 1px),
          linear-gradient(to bottom, var(--cs-text-primary) 1px, transparent 1px)
        `,
                backgroundSize: "60px 60px",
            }}
        />
    );
}

/**
 * Gradient mesh background
 */
export function GradientMesh() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0">
            {/* Top gradient */}
            <div
                className="absolute top-0 left-0 right-0 h-[50vh]"
                style={{
                    background: "linear-gradient(180deg, rgba(168, 255, 0, 0.03) 0%, transparent 100%)",
                }}
            />

            {/* Bottom gradient */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[30vh]"
                style={{
                    background: "linear-gradient(0deg, rgba(26, 26, 26, 0.02) 0%, transparent 100%)",
                }}
            />

            {/* Side gradients */}
            <div
                className="absolute top-0 left-0 bottom-0 w-[30vw]"
                style={{
                    background: "linear-gradient(90deg, rgba(232, 232, 230, 0.5) 0%, transparent 100%)",
                }}
            />
            <div
                className="absolute top-0 right-0 bottom-0 w-[30vw]"
                style={{
                    background: "linear-gradient(270deg, rgba(232, 232, 230, 0.3) 0%, transparent 100%)",
                }}
            />
        </div>
    );
}

/**
 * Noise texture overlay for premium feel
 */
export function NoiseTexture() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
        />
    );
}

/**
 * Combined animated background
 */
export function AnimatedBackground() {
    return (
        <>
            <GradientMesh />
            <GridPattern />
            <FloatingShapes />
            <NoiseTexture />
        </>
    );
}
