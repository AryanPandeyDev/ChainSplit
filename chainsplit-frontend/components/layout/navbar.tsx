"use client";

import Link from "next/link";
import { useWallet } from "@/hooks";
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
        { href: "/docs", label: "Docs" },
    ];

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
        }
    };

    return (
        <nav
            className={`sticky top-0 z-50 w-full transition-colors duration-200 ${transparent
                    ? "bg-transparent"
                    : "bg-[var(--cs-bg-offwhite)] border-b border-[var(--cs-border-light)]"
                }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xl font-semibold text-[var(--cs-text-primary)] hover:opacity-80 transition-opacity"
                    >
                        <span className="text-2xl">🔗</span>
                        <span>ChainSplit</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {isConnected && (
                            <>
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-[var(--cs-text-secondary)] hover:text-[var(--cs-text-primary)] transition-colors font-medium"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </>
                        )}

                        {/* Wallet Button */}
                        {isConnected && address ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="rounded-full px-4 py-2 border-[var(--cs-border-light)] bg-white hover:bg-gray-50"
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
                                            href={`https://etherscan.io/address/${address}`}
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
                                className="rounded-full px-6 py-2 bg-[var(--cs-card-dark)] text-white hover:bg-[var(--cs-card-dark-secondary)] transition-colors"
                            >
                                {isConnecting ? "Connecting..." : "Connect Wallet"}
                            </Button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px]">
                            <div className="flex flex-col gap-6 mt-8">
                                {isConnected && (
                                    <>
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setMobileOpen(false)}
                                                className="text-lg font-medium text-[var(--cs-text-primary)] hover:text-[var(--cs-accent-green-hover)]"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                        <div className="border-t border-[var(--cs-border-light)] pt-4">
                                            <p className="text-sm text-[var(--cs-text-secondary)] mb-2">
                                                Connected
                                            </p>
                                            <p className="font-mono text-sm">
                                                {address && truncateAddress(address)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                disconnect();
                                                setMobileOpen(false);
                                            }}
                                            className="w-full justify-start text-red-600"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Disconnect
                                        </Button>
                                    </>
                                )}
                                {!isConnected && (
                                    <Button
                                        onClick={() => {
                                            connect();
                                            setMobileOpen(false);
                                        }}
                                        disabled={isConnecting}
                                        className="w-full rounded-full bg-[var(--cs-card-dark)] text-white"
                                    >
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
