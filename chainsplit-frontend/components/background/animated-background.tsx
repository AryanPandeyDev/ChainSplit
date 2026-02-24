"use client";

import { motion } from "framer-motion";

/**
 * Orbiting gradient orbs — slow elliptical paths at very low opacity.
 * Creates ambient, organic light movement on the dark background.
 */
function OrbitalGlows() {
    const orbs = [
        {
            color: "rgba(140, 100, 255, 0.06)",
            size: 600,
            top: "-10%",
            left: "60%",
            duration: 25,
            rx: 80,
            ry: 40,
        },
        {
            color: "rgba(80, 120, 255, 0.05)",
            size: 500,
            top: "40%",
            left: "-10%",
            duration: 30,
            rx: 60,
            ry: 50,
        },
        {
            color: "rgba(80, 200, 200, 0.04)",
            size: 450,
            top: "70%",
            left: "70%",
            duration: 22,
            rx: 50,
            ry: 70,
        },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: orb.size,
                        height: orb.size,
                        top: orb.top,
                        left: orb.left,
                        background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                        filter: "blur(40px)",
                    }}
                    animate={{
                        x: [0, orb.rx, 0, -orb.rx, 0],
                        y: [0, -orb.ry, 0, orb.ry, 0],
                    }}
                    transition={{
                        duration: orb.duration,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Dot grid — subtle grid pattern using radial-gradient dots
 */
function DotGrid() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }}
        />
    );
}

/**
 * Noise texture overlay for film-grain feel
 */
function NoiseTexture() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
        />
    );
}

/**
 * Combined dark-theme animated background
 */
export function AnimatedBackground() {
    return (
        <>
            <OrbitalGlows />
            <DotGrid />
            <NoiseTexture />
        </>
    );
}
