"use client";

import Link from "next/link";
import { useWallet } from "@/hooks";
import { explorerAddressUrl } from "@/lib/explorer";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface NavbarProps {
    /** Whether to use transparent background (for landing page) */
    transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
    const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: "/dashboard", label: "Dashboard" },
    ];

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
        }
    };

    /* ── Landing page: floating transparent layout ── */
    if (transparent) {
        return (
            <nav className="sticky top-0 z-50 w-full py-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo — left */}
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-xl font-semibold text-white hover:opacity-80 transition-opacity"
                        >
                            <span className="text-2xl">🔗</span>
                            <span>ChainSplit</span>
                        </Link>

                        {/* Center — glassmorphic pill nav */}
                        <div className="hidden md:flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] backdrop-blur-md px-2 py-1.5">
                            {[
                                { href: "#features", label: "Features" },
                                { href: "#how-it-works", label: "How It Works" },
                                { href: "#about", label: "About" },
                                ...(isConnected ? [{ href: "/dashboard", label: "Dashboard" }] : []),
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors rounded-full hover:bg-[rgba(255,255,255,0.06)]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right — CTA / wallet */}
                        <div className="hidden md:flex items-center">
                            {isConnected && address ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-4 py-2 border-[rgba(255,255,255,0.15)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.06)]"
                                        >
                                            <Wallet className="w-4 h-4 mr-2" />
                                            {truncateAddress(address)}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={handleCopyAddress}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Address
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <a
                                                href={explorerAddressUrl(address)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View on Explorer
                                            </a>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => disconnect()}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Disconnect
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={connect}
                                    disabled={isConnecting}
                                    className="rounded-full px-6 py-2 border border-[rgba(255,255,255,0.2)] bg-transparent text-white font-medium hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                                >
                                    {isConnecting ? "Connecting..." : "Get Started"}
                                </Button>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon" className="text-white hover:bg-[rgba(255,255,255,0.06)]">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[280px]">
                                <div className="flex flex-col gap-6 mt-8">
                                    <Link href="#features" onClick={() => setMobileOpen(false)} className="text-lg font-medium">Features</Link>
                                    <Link href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-lg font-medium">How It Works</Link>
                                    <Link href="#about" onClick={() => setMobileOpen(false)} className="text-lg font-medium">About</Link>
                                    {isConnected && (
                                        <>
                                            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-lg font-medium">Dashboard</Link>
                                            <div className="border-t pt-4">
                                                <p className="text-sm text-muted-foreground mb-2">Connected</p>
                                                <p className="font-mono text-sm">{address && truncateAddress(address)}</p>
                                            </div>
                                            <Button variant="outline" onClick={() => { disconnect(); setMobileOpen(false); }} className="w-full justify-start text-red-600">
                                                <LogOut className="w-4 h-4 mr-2" /> Disconnect
                                            </Button>
                                        </>
                                    )}
                                    {!isConnected && (
                                        <Button onClick={() => { connect(); setMobileOpen(false); }} disabled={isConnecting} className="w-full rounded-full">
                                            {isConnecting ? "Connecting..." : "Connect Wallet"}
                                        </Button>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>
        );
    }

    /* ── Default: solid navbar for app pages ── */
    return (
        <nav className="sticky top-0 z-50 w-full bg-[var(--cs-bg-offwhite)] border-b border-[var(--cs-border-light)] transition-colors duration-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-[var(--cs-text-primary)] hover:opacity-80 transition-opacity">
                        <span className="text-2xl">🔗</span>
                        <span>ChainSplit</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        {isConnected && navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="transition-colors font-medium text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)]">
                                {link.label}
                            </Link>
                        ))}
                        {isConnected && address ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="rounded-full px-4 py-2 border-[var(--cs-border-light)] bg-white hover:bg-gray-50">
                                        <Wallet className="w-4 h-4 mr-2" />
                                        {truncateAddress(address)}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={handleCopyAddress}>
                                        <Copy className="w-4 h-4 mr-2" /> Copy Address
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" /> View on Explorer
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => disconnect()} className="text-red-600 focus:text-red-600">
                                        <LogOut className="w-4 h-4 mr-2" /> Disconnect
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button onClick={connect} disabled={isConnecting} className="rounded-full px-6 py-2 bg-[var(--cs-card-dark)] text-white hover:bg-[var(--cs-card-dark-secondary)]">
                                {isConnecting ? "Connecting..." : "Connect Wallet"}
                            </Button>
                        )}
                    </div>
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px]">
                            <div className="flex flex-col gap-6 mt-8">
                                {isConnected && navLinks.map((link) => (
                                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-lg font-medium">{link.label}</Link>
                                ))}
                                {isConnected && address && (
                                    <>
                                        <div className="border-t pt-4">
                                            <p className="text-sm text-muted-foreground mb-2">Connected</p>
                                            <p className="font-mono text-sm">{truncateAddress(address)}</p>
                                        </div>
                                        <Button variant="outline" onClick={() => { disconnect(); setMobileOpen(false); }} className="w-full justify-start text-red-600">
                                            <LogOut className="w-4 h-4 mr-2" /> Disconnect
                                        </Button>
                                    </>
                                )}
                                {!isConnected && (
                                    <Button onClick={() => { connect(); setMobileOpen(false); }} disabled={isConnecting} className="w-full rounded-full bg-[var(--cs-card-dark)] text-white">
                                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
