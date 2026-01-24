# ChainSplit

**Decentralized Group Expense Settlement** - A dApp that integrates expense tracking and financial settlement into a single workflow, ensuring debts are not just "recorded" but "guaranteed."

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange)](https://getfoundry.sh/)
[![Tests](https://img.shields.io/badge/Tests-103%20Passing-green)](./test)

## Problem Statement

Traditional expense-splitting apps like Splitwise have a **"Last Mile" problem**: they track debts perfectly but cannot enforce settlement. Users must switch to third-party apps (Venmo/UPI) to pay, leading to delayed or forgotten reimbursements.

**ChainSplit solves this** by making the **Ledger the Bank** - where acknowledging a debt grants the permission to settle it on-chain.

---

## Features

| Feature | Description |
|---------|-------------|
| **Two Settlement Modes** | **Escrow** (pre-funded deposits) or **Direct** (pull-based) |
| **Smart Expense Logging** | Amounts on-chain, metadata (receipts) via IPFS CID |
| **Trustless Settlement** | Automatic net flow calculation |
| **Pull Payment Security** | Receivers initiate withdrawals (no push payment risks) |
| **Gas Optimized** | Solidity optimizer enabled, efficient storage patterns |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ChainSplitFactory                        │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  createEscrowGroup()│  │ createDirectGroup() │          │
│  └──────────┬──────────┘  └──────────┬──────────┘          │
└─────────────┼────────────────────────┼──────────────────────┘
              │                        │
              ▼                        ▼
      ┌───────────────┐        ┌───────────────┐
      │  GroupEscrow  │        │  GroupDirect  │
      │  (pre-funded) │        │ (pull-based)  │
      └───────────────┘        └───────────────┘
```

### Settlement Modes

| Mode | How it Works | Best For |
|------|--------------|----------|
| **Escrow** | All members deposit upfront → expenses debit/credit internal balances → withdraw after group closes | High-trust, trip planning |
| **Direct** | No deposits → payer creates expense → participants accept → settlement pulls via `transferFrom` | Quick splits, ongoing groups |

---

## Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Node.js 18+ (for frontend)

### Setup

```bash
# Clone and install
git clone https://github.com/AryanPandeyDev/ChainSplit.git
cd ChainSplit
forge install

# Build
forge build

# Test (103 tests)
forge test

# Start local node
anvil

# Deploy locally (in new terminal)
make deploy-local
```

---

## Contract Addresses

| Network | Factory | MockUSDC |
|---------|---------|----------|
| **Anvil (local)** | Deployed via `make deploy-local` | Auto-deployed |
| **Sepolia** | `TBD` | `TBD` |
| **Base Sepolia** | `TBD` | `TBD` |

---

## Frontend Integration Guide

### 1. Contract ABIs

After building, find ABIs in:
```
out/ChainSplitFactory.sol/ChainSplitFactory.json
out/GroupDirect.sol/GroupDirect.json
out/GroupEscrow.sol/GroupEscrow.json
```

### 2. Connecting (ethers.js v6)

```javascript
import { ethers } from 'ethers';
import FactoryABI from './abis/ChainSplitFactory.json';
import GroupDirectABI from './abis/GroupDirect.json';

// Connect to provider
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Factory contract
const factory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI.abi, signer);

// Create a Direct group
const tx = await factory.createDirectGroup(
  "Trip to Goa",           // name
  USDC_ADDRESS,            // token
  [member1, member2, member3]  // members
);
const receipt = await tx.wait();

// Get group address from event
const event = receipt.logs.find(log => log.fragment?.name === 'DirectGroupCreated');
const groupAddress = event.args[0];
```

### 3. IPFS Integration

**ChainSplit stores IPFS CIDs on-chain, not files.** Your frontend must:

```javascript
// 1. Upload file to IPFS (using Pinata example)
import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({ pinataJwt: PINATA_JWT });

async function uploadReceipt(file) {
  const result = await pinata.upload.file(file);
  return result.IpfsHash; // e.g., "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
}

// 2. Pass CID to contract
const ipfsCid = await uploadReceipt(receiptFile);

const group = new ethers.Contract(groupAddress, GroupDirectABI.abi, signer);
await group.createExpense(
  ethers.parseUnits("100", 6),  // 100 USDC
  [member1, member2],           // participants
  [50_000000, 50_000000],       // shares (50 each)
  ipfsCid                       // IPFS CID for receipt
);
```

### 4. Direct Mode Flow (Frontend)

```javascript
// Step 1: Create expense (payer)
const expenseId = await group.createExpense(amount, participants, shares, ipfsCid);

// Step 2: Accept expense (each non-payer participant)
await group.acceptExpense(expenseId);

// Step 3: Approve tokens (each participant - CRITICAL!)
const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
await token.approve(groupAddress, ethers.MaxUint256);

// Step 4: Settle expense (payer calls after all accept)
await group.settleExpense(expenseId);

// Step 5: Withdraw (payer claims their reimbursement)
await group.withdraw();
```

### 5. Escrow Mode Flow (Frontend)

```javascript
// Step 1: Approve and deposit (each member)
await token.approve(groupAddress, depositAmount);
await group.deposit();

// Step 2: Create expense (any deposited member)
await group.createExpense(amount, participants, shares, ipfsCid);

// Step 3: Accept expense (auto-settles on last accept)
await group.acceptExpense(expenseId);

// Step 4: Close group (requires unanimous vote)
await group.proposeClose();  // First member
await group.voteClose();     // Other members

// Step 5: Withdraw final balances
await group.withdraw();
```

### 6. Reading Group Data

```javascript
// Get user's groups
const userGroups = await factory.getGroupsByUser(userAddress);

// Get group info (Direct mode)
const [name, token, memberCount, expenseCount] = await group.getGroupInfo();

// Get member balance
const netBalance = await group.getBalance(memberAddress);      // int256 (can be negative)
const withdrawable = await group.getWithdrawableBalance(memberAddress);

// Get expense details
const [payer, amount, ipfsCid, state, acceptedCount] = await group.getExpense(expenseId);
```

---

## CLI Commands

```bash
# Build & Test
make build          # Compile contracts
make test           # Run all tests
make test-v         # Verbose test output
make coverage       # Coverage report

# Local Development
anvil               # Start local node
make deploy-local   # Deploy to Anvil
make mint-tokens    # Mint test USDC

# Escrow Mode
make create-group   # Create escrow group
make deposit        # Deposit to group
make create-expense # Create expense
make accept-expense # Accept expense
make propose-close  # Propose closure
make withdraw       # Withdraw balance

# Direct Mode
make direct-group   # Create direct group
make direct-expense # Create expense
make direct-accept  # Accept expense
make direct-settle  # Settle expense
make direct-withdraw # Withdraw balance
make direct-view    # View group info
```

---

## Security

| Pattern | Implementation |
|---------|----------------|
| **ReentrancyGuard** | All fund-moving functions protected |
| **SafeERC20** | All token transfers use OpenZeppelin's safe wrappers |
| **Pull Payment** | Users must call `withdraw()` - no push payments |
| **Checks-Effects-Interactions** | State updated before external calls |
| **Access Control** | Modifiers verify membership, payer status, expense state |

---

## Testing

```bash
# Run all 103 tests
forge test

# With gas report
forge test --gas-report

# Specific test file
forge test --match-path test/unit/GroupDirect.t.sol -vvv
```

### Test Coverage

| Contract | Unit Tests | Integration Tests |
|----------|------------|-------------------|
| GroupEscrow | 38 | 2 |
| GroupDirect | 37 | 4 |
| ExpenseLib | 22 | - |

---

## Project Structure

```
ChainSplit/
├── src/
│   ├── ChainSplitFactory.sol    # Factory for creating groups
│   ├── core/
│   │   ├── GroupEscrow.sol      # Escrow mode group
│   │   └── GroupDirect.sol      # Direct mode group
│   └── libraries/
│       └── ExpenseLib.sol       # Share calculation utilities
├── script/
│   ├── Deploy.s.sol             # Deployment scripts
│   └── Interactions.s.sol       # CLI interaction scripts
├── test/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── mocks/                   # Mock contracts
├── docs/                        # Documentation
└── Makefile                     # CLI commands
```

---

## Gas Estimates

| Operation | Gas (approx) |
|-----------|--------------|
| Create Direct Group (3 members) | ~1,700,000 |
| Create Expense | ~280,000 |
| Accept Expense | ~80,000 |
| Settle Expense (2 participants) | ~180,000 |
| Withdraw | ~40,000 |

---

## License

MIT

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`forge test`)
4. Commit changes (`git commit -m 'feat: add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request
