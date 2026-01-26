# ChainSplit

**ChainSplit** is a decentralized expense splitting application (dApp) that allows users to manage shared expenses on-chain with automatic settlement via escrow or direct payments.

## 🏗️ Architecture

The project is organized as a monorepo with three main components:

- **[Smart Contracts](./smart_contracts/)**: Solidity contracts for group management, expense tracking, and escrow logic. Built with Foundry.
- **[Frontend](./chainsplit-frontend/)**: Next.js 14 + TypeScript web interface used to interact with the dApp.
- **[Backend](./backend/)**: Express.js server for handling off-chain data (e.g., receipt images) via IPFS/Pinata.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (forge, anvil)
- MetaMask or any Web3 wallet

### 1. Start Local Blockchain
```bash
cd smart_contracts
anvil
```

### 2. Deploy Contracts
In a new terminal:
```bash
cd smart_contracts
make deploy-local
```
*Note: Copy the deployed `Factory` address.*

### 3. Start Backend
In a new terminal:
```bash
cd backend
npm install
# Configure .env (see backend/README.md)
npm run dev
```

### 4. Start Frontend
In a new terminal:
```bash
cd chainsplit-frontend
npm install
# Configure .env.local with Factory address (see chainsplit-frontend/README.md)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## 🧪 Testing

- **Contracts**: `cd smart_contracts && forge test`
- **Frontend**: `cd chainsplit-frontend && npm run lint`
