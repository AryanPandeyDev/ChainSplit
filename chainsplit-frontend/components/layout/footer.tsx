import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#050505] text-white py-12 border-t border-[rgba(255,255,255,0.08)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="mb-4 flex items-center gap-2 text-xl font-semibold">
                            <LogoMark className="size-6" />
                            <span className="font-[family-name:var(--font-landing-wordmark)] text-[0.92rem] uppercase tracking-[0.16em]">
                                ChainSplit
                            </span>
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            Split expenses with friends and settle on-chain. Trustless, transparent, and secure.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>
                                <Link href="/dashboard" className="hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white transition-colors"
                                >
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-white transition-colors"
                                >
                                    Smart Contracts
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                    <p>© {currentYear} ChainSplit. Built for transparent group settlements.</p>
                </div>
            </div>
        </footer>
    );
}
