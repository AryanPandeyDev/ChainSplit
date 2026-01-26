# ChainSplit Frontend

A production-grade Next.js 14 TypeScript frontend for ChainSplit - the decentralized expense splitting app.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Web3**: wagmi v2 + viem + TanStack Query
- **Animations**: Framer Motion
- **Forms**: react-hook-form + Zod

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure environment variables (see below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_APP_NAME=ChainSplit
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_FACTORY_ADDRESS=0x... # From smart contract deployment
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

## Project Structure

```
chainsplit-frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # User dashboard
│   └── groups/[id]/       # Group detail & expense pages
├── components/
│   ├── ui/                # shadcn components
│   ├── layout/            # Navbar, Footer
│   ├── cards/             # GroupCard, ExpenseCard
│   ├── modals/            # CreateGroup, AcceptExpense, Escrow modals
│   ├── display/           # BalanceDisplay
│   ├── landing/           # Hero, sections
│   └── background/        # Animated background
├── hooks/                 # Custom React hooks
│   ├── use-wallet.ts      # Wallet connection
│   ├── use-groups.ts      # Group data
│   └── use-contracts.ts   # Contract interactions
├── lib/
│   ├── contracts/         # Typed ABIs
│   ├── wagmi-config.ts    # wagmi setup
│   └── viem-client.ts     # viem public client
└── public/
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with animated hero |
| `/dashboard` | User's groups and balances |
| `/groups/[id]` | Group detail with tabs |
| `/groups/[id]/expense/new` | Add new expense |

## Key Features

### Web3 Integration
- Wallet connection via injected providers (MetaMask, etc.)
- Typed contract ABIs for Factory, GroupDirect, GroupEscrow
- Real-time contract data via TanStack Query

### UI Components
- **GroupCard**: Shows group info, mode badge, balance
- **ExpenseCard**: State-aware with Accept/Settle/Cancel actions
- **BalanceDisplay**: Color-coded positive/negative/zero states
- **TransactionStatus**: Pending spinner, success, failure states

### Escrow Flows
- **Deposit Modal**: Two-step approve + deposit flow
- **Close Group Modal**: Vote progress with member indicators
- **Withdraw Modal**: Balance preview with confirmation

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npm run start    # Start production server
```

## Related

- [Backend API](../backend/) - Express server for IPFS uploads
- [Smart Contracts](../smart_contracts/) - Foundry contracts
