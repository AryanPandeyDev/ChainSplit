import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[var(--cs-bg-offwhite)] text-[var(--cs-text-primary)] py-12 border-t border-[rgba(0,255,136,0.12)]">
            {/* Neon gradient divider */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="cyber-divider mb-10" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="mb-4 flex items-center gap-2 text-xl font-semibold">
                            <LogoMark className="size-6" />
                            <span className="font-[family-name:var(--font-landing-wordmark)] text-[0.92rem] uppercase tracking-[0.16em] neon-text-green">
                                ChainSplit
                            </span>
                        </Link>
                        <p className="text-[var(--cs-text-secondary)] max-w-sm">
                            Split expenses with friends and settle on-chain. Trustless, transparent, and secure.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold mb-4 text-[var(--cs-neon-blue)]">Product</h3>
                        <ul className="space-y-2 text-[var(--cs-text-secondary)]">
                            <li>
                                <Link href="/dashboard" className="hover:text-[var(--cs-accent-green)] transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-semibold mb-4 text-[var(--cs-neon-blue)]">Resources</h3>
                        <ul className="space-y-2 text-[var(--cs-text-secondary)]">
                            <li>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[var(--cs-accent-green)] transition-colors"
                                >
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-[var(--cs-accent-green)] transition-colors"
                                >
                                    Smart Contracts
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="cyber-divider mt-8 mb-6" />
                <div className="text-center text-[var(--cs-text-secondary)] text-sm">
                    <p>© {currentYear} ChainSplit. Built for transparent group settlements.</p>
                </div>
            </div>
        </footer>
    );
}
