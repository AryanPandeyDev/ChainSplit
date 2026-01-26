"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi-config";
import { useState, type ReactNode } from "react";

interface ProvidersProps {
    children: ReactNode;
}

/**
 * Root providers wrapper for the application.
 * Includes wagmi for Web3 and TanStack Query for data fetching.
 */
export function Providers({ children }: ProvidersProps) {
    // Create QueryClient instance once per component lifecycle
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Disable automatic refetching in background
                        refetchOnWindowFocus: false,
                        // Stale time of 30 seconds for contract reads
                        staleTime: 30 * 1000,
                        // Retry failed queries up to 2 times
                        retry: 2,
                    },
                },
            })
    );

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
