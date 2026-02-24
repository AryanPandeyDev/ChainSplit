import type { Metadata } from "next";
import { Inter, DM_Serif_Display, Space_Mono, DotGothic16, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const appMono = Space_Mono({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const appDisplay = DotGothic16({
  variable: "--font-app-display",
  subsets: ["latin"],
  weight: "400",
});

const landingWordmark = Orbitron({
  variable: "--font-landing-wordmark",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  title: "ChainSplit | Split Expenses, Settle On-Chain",
  description:
    "The decentralized expense splitting app. Create groups, log expenses, and settle payments on-chain with trustless, transparent transactions.",
  keywords: ["expense splitting", "blockchain", "crypto", "DeFi", "Web3", "Ethereum"],
  openGraph: {
    title: "ChainSplit | Split Expenses, Settle On-Chain",
    description:
      "The decentralized expense splitting app. Create groups, log expenses, and settle payments on-chain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmSerif.variable} ${appMono.variable} ${appDisplay.variable} ${landingWordmark.variable} font-sans antialiased`}
        style={{ backgroundColor: "var(--cs-bg-offwhite)" }}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
