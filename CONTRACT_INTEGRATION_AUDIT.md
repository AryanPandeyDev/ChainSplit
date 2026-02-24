# ChainSplit Contract Integration Audit

Generated: February 24, 2026  
Audit baseline: **current local workspace state** (including uncommitted changes)

## 1. Scope Reviewed

### Smart contracts and docs
- `smart_contracts/docs/PROJECT_OVERVIEW.md`
- `smart_contracts/docs/CONTRACT_ARCHITECTURE.md`
- `smart_contracts/docs/SETTLEMENT_RULES.md`
- `smart_contracts/docs/SECURITY_BASELINE.md`
- `smart_contracts/docs/AGENT_CHARTER.md`
- `smart_contracts/src/ChainSplitFactory.sol`
- `smart_contracts/src/core/GroupDirect.sol`
- `smart_contracts/src/core/GroupEscrow.sol`
- `smart_contracts/src/libraries/ExpenseLib.sol`
- `smart_contracts/script/*.s.sol`
- `smart_contracts/test/unit/*.t.sol`
- `smart_contracts/test/integration/*.t.sol`

### Frontend
- `chainsplit-frontend/app/**/*`
- `chainsplit-frontend/hooks/**/*`
- `chainsplit-frontend/lib/contracts/**/*`
- `chainsplit-frontend/components/**/*`
- `chainsplit-frontend/README.md`

### Backend
- `backend/src/**/*`
- `backend/README.md`

---

## 2. Executive Summary

The project has strong **contract implementation coverage** and good **Direct-mode UX coverage**, but **Escrow mode is materially under-integrated in the UI** and has ABI/decoding mismatches that currently break correctness for escrow group views and flows.

### Bottom line
- Smart contracts: comprehensive and tested.
- Frontend:
  - Direct mode: mostly wired (create expense, accept, settle) but missing withdraw/cancel controls.
  - Escrow mode: major missing user actions (deposit, close voting, withdraw, cancel/refund) and ABI mismatches.
- Backend: solid for current IPFS pinning scope, but limited to that scope.

### High-level integration score (contracts vs frontend/backend)
- `Integrated`: **9 / 26** (34.6%)
- `Partially integrated`: **7 / 26** (26.9%)
- `Missing`: **10 / 26** (38.5%)
- Weighted completion (`Integrated + 0.5*Partial`): **48.1%**
- Remaining to fully integrate: **~51.9%**

---

## 3. Smart Contract Reality (Source of Truth)

## 3.1 Factory (`ChainSplitFactory`)

Implemented capabilities:
- `createDirectGroup(...)` (`smart_contracts/src/ChainSplitFactory.sol:81`)
- `createEscrowGroup(...)` (`smart_contracts/src/ChainSplitFactory.sol:135`)
- `getGroupMode(...)` (`:195`)
- `getGroupsByUser(...)` (`:204`)
- `getGroupCount()` (`:214`)
- `getAllGroups()` (`:223`)
- `getGroupsPaginated(...)` (`:233`)

Notes:
- Validates name/token/member count.
- Escrow path validates non-zero deposit and future deadline.

## 3.2 Direct Mode (`GroupDirect`)

Implemented capabilities:
- `createExpense(...)`
- `acceptExpense(...)` (`smart_contracts/src/core/GroupDirect.sol:258`)
- `settleExpense(...)` (`:299`)
- `cancelExpense(...)` (`:405`)
- `withdraw()` (`:425`)
- `getGroupInfo()` (`:505`)
- `getExpense(...)`, `getExpenseParticipants(...)`, `getMembers()`, `getBalance(...)`
- `getWithdrawableBalance(...)` (`:532`)

Key behavior:
- Settlement is explicit payer action (`settleExpense`) and uses `transferFrom` pulls.
- Withdrawals are from `withdrawableBalance`, not from signed net balance alone.

## 3.3 Escrow Mode (`GroupEscrow`)

Implemented capabilities:
- `deposit()` (`smart_contracts/src/core/GroupEscrow.sol:253`)
- `cancelGroup()` (`:288`)
- `checkDeadline()` (`:297`)
- `refundDeposit()` (`:308`)
- `createExpense(...)`
- `acceptExpense(...)` (auto-settles on last required acceptance)
- `cancelExpense(...)`
- `proposeClose()` (`:524`)
- `voteClose()` (`:549`)
- `withdraw()` (`:596`)
- `getGroupInfo()` (`:680`)

Important state model:
- `GroupState = Pending, Active, ClosePending, Closed, Cancelled` (`:39`)
- `getGroupInfo()` returns: `(name, token, state, memberCount, depositCount)`

---

## 4. Docs vs Solidity Reality (Important Deltas)

## 4.1 Escrow `getGroupInfo` shape
- Docs/frontend assumptions often treat this like direct-mode `(name, token, memberCount, expenseCount)`.
- Actual escrow contract returns `(name, token, state, memberCount, depositCount)`.
- This is the single largest frontend correctness break for escrow screens.

## 4.2 Escrow participant model
- Docs describe “all members participate” behavior.
- Actual contract allows caller-supplied participant subsets (validated as deposited members).

## 4.3 Cancellation/refund mechanism
- Docs language can be read as automatic refund on cancel/deadline.
- Actual contract requires each user to call `refundDeposit()` after cancellation.

---

## 5. Frontend Integration Findings

## 5.1 What is working well

- Factory group creation transactions are wired:
  - `useCreateDirectGroup` / `useCreateEscrowGroup` in `hooks/useGroups.ts`
- User group listing and mode lookup:
  - `useUserGroups`, `useGroupMode`
- Expense create flow:
  - New expense page uploads metadata + calls `createExpense(...)`.
- Direct mode acceptance and settlement:
  - Group page and expense detail page call `acceptExpense` and `settleExpense`.
- IPFS roundtrip:
  - Upload file (`/api/pin/file`) and metadata (`/api/pin/json`) from UI.
  - Read metadata CID and render receipt in expense detail.
- Real-time expense event invalidation (ExpenseCreated/Accepted/Settled/Cancelled).

## 5.2 Critical gaps and misintegrations

### A) Escrow ABI wrapper is out of sync with contract

File: `chainsplit-frontend/lib/contracts/group-escrow.ts`

Issues:
- Enum mismatch: missing `ClosePending` and `Cancelled` states.
- `getGroupInfo` output signature is incorrect for escrow.
- Contains non-existent functions in ABI (`cancelClose`, `hasVotedClose`, `closeVoteCount`, `NAME`).
- Event names/fields mismatch current Solidity events.

Impact:
- Escrow state decoding is unreliable and future write/read calls are fragile.

### B) Escrow group info decoding bug propagates through pages/hooks

Files:
- `chainsplit-frontend/hooks/useGroupDetails.ts`
- `chainsplit-frontend/app/groups/[id]/page.tsx`

Both decode escrow `getGroupInfo` as `[name, token, memberCount, expenseCount]`, but contract returns `[name, token, state, memberCount, depositCount]`.

Impact:
- Escrow member count becomes state value.
- Expense count becomes member count.
- Escrow group screens can fetch wrong member/expense ranges and show incorrect UI.

### C) Missing escrow lifecycle actions in UI

Hooks exist but are not wired to pages:
- `useDeposit`
- `useProposeClose`
- `useVoteClose`
- `useWithdraw`
- `useGroupState`

Also missing:
- `cancelGroup`, `checkDeadline`, `refundDeposit` UX entirely.

Impact:
- Escrow groups cannot complete required on-chain lifecycle through the app.

### D) Missing direct critical actions in UI

- `cancelExpense` hook exists but not used.
- `withdraw` hook exists but not used.

Impact:
- Direct flow cannot complete payout claim inside UI.

### E) Group creation payload loses user-entered group name

File: `chainsplit-frontend/hooks/useGroups.ts`

`useCreateGroup` hardcodes `"Group"` instead of using modal input.

Impact:
- On-chain group names are not what users enter.

### F) Explorer and docs link issues

- Navbar and landing link to `/docs*` routes, but app folder has no docs route.
- Explorer links are hardcoded to Etherscan even when using non-Ethereum chains/local.

---

## 6. Backend Integration Findings

Backend scope currently is IPFS pinning + service health, not chain indexing.

Implemented:
- `POST /api/pin/file`
- `POST /api/pin/json`
- `GET /api/pin/status`

Frontend uses:
- `/api/pin/file` and `/api/pin/json` from new expense flow.
- No frontend use of `/api/pin/status`.

Observations:
- `PINATA_JWT` exists in env schema but service uses only API key/secret.
- This is acceptable for MVP but should be standardized.
- Backend is not a blocker for contract settlement integration; UI-chain wiring is the blocker.

---

## 7. Capability Matrix (Contracts vs App Integration)

| # | Capability | Contract support | Frontend/Backend status | Assessment |
|---|---|---|---|---|
| 1 | Create Direct group | Yes | UI wired, but name handling issue | Partial |
| 2 | Create Escrow group | Yes | UI wired, but name handling issue | Partial |
| 3 | List groups by user | Yes | Dashboard wired | Integrated |
| 4 | Detect group mode | Yes | Used in dashboard/group pages | Integrated |
| 5 | Global discovery (count/pagination) | Yes | Hooks exist, no UI | Partial |
| 6 | Direct create expense | Yes | New expense page wired | Integrated |
| 7 | Direct accept expense | Yes | Group page wired | Integrated |
| 8 | Direct settle expense | Yes | Group/detail pages wired | Integrated |
| 9 | Direct cancel expense | Yes | No UI action wired | Missing |
| 10 | Direct withdraw | Yes | No UI action wired | Missing |
| 11 | Expense detail read | Yes | Expense detail page wired | Integrated |
| 12 | Correct member/expense reads across modes | Yes | Escrow decode bug | Partial |
| 13 | Escrow deposit | Yes | Hook exists, no UI usage | Missing |
| 14 | Escrow state-driven lifecycle UI | Yes | Not surfaced correctly | Missing |
| 15 | Escrow create expense | Yes | Path exists but decode issues affect correctness | Partial |
| 16 | Escrow accept + auto-settle | Yes | Path exists but decode issues affect correctness | Partial |
| 17 | Escrow cancel expense | Yes | No UI wiring | Missing |
| 18 | Escrow propose close | Yes | Hook exists, no UI wiring | Missing |
| 19 | Escrow vote close | Yes | Hook exists, no UI wiring | Missing |
| 20 | Escrow withdraw after close | Yes | Hook exists, no UI wiring | Missing |
| 21 | Escrow cancel/deadline/refund flows | Yes | No UI/hook coverage for full flow | Missing |
| 22 | Receipt image IPFS upload | N/A (off-chain) | Backend + frontend integrated | Integrated |
| 23 | Expense metadata IPFS upload and CID on-chain | Yes | Integrated | Integrated |
| 24 | Metadata/receipt retrieval in detail page | Yes | Integrated | Integrated |
| 25 | Event-driven UI refresh | Yes | Expense events only | Partial |
| 26 | ABI parity with deployed contracts | Required | Escrow and parts of direct ABI drift | Missing |

---

## 8. “How Much Is Left to Integrate?”

Based on the matrix above:

- Fully integrated: `9/26` = **34.6%**
- Partially integrated: `7/26` = **26.9%**
- Missing: `10/26` = **38.5%**
- Weighted completion (full + half partial): **48.1%**

### Mode-specific view

#### Direct mode (core user flow)
- Strongest area today.
- Missing critical completion actions: `cancelExpense`, `withdraw`.
- Practical readiness: **medium-high**, but not end-to-end complete in UI.

#### Escrow mode (core user flow)
- Core on-chain functionality exists, but UI lifecycle is largely not implemented.
- ABI/decoding issues currently undermine correctness.
- Practical readiness: **low** until P0 items are fixed.

---

## 9. Prioritized Integration Backlog

## P0 (Do first)

1. **Fix ABI parity for escrow/direct wrapper files**
- Update `chainsplit-frontend/lib/contracts/group-escrow.ts` and `group-direct.ts` to exact Solidity ABI.
- Acceptance criteria:
  - No non-existent function/event entries.
  - Escrow enum includes `ClosePending`, `Cancelled`.
  - `getGroupInfo` signatures match contracts by mode.

2. **Fix mode-specific tuple decoding**
- In `hooks/useGroupDetails.ts` and `app/groups/[id]/page.tsx`, branch decode by mode.
- Acceptance criteria:
  - Escrow member count, state, deposit count render correctly.
  - Expense counts are not inferred from wrong tuple indices.

3. **Wire missing direct actions**
- Add `cancelExpense` and `withdraw` actions where expected.
- Acceptance criteria:
  - Direct payer can cancel pending expense.
  - Direct users with positive withdrawable balance can withdraw in UI.

4. **Wire escrow lifecycle actions**
- Add deposit, propose close, vote close, withdraw UI and state gating.
- Acceptance criteria:
  - Full escrow journey executable from frontend without scripts.

5. **Fix group creation payload correctness**
- Pass user-entered name into create calls.
- Remove hardcoded `"Group"` from `useCreateGroup`.

## P1 (Next)

6. **Add escrow cancel/deadline/refund UX**
- Support `cancelGroup`, `checkDeadline`, `refundDeposit`.

7. **Expand event watchers**
- Add escrow lifecycle events (deposits, close votes, group closed/cancelled).

8. **Allowance/balance preflight for direct accept**
- Add clear warnings before approval/accept action.

9. **Backend auth standardization**
- Support `PINATA_JWT` path or remove unused env field.

## P2 (Polish)

10. **Fix dead links and route consistency**
- Add `/docs` route or remove references.

11. **Chain-aware explorer URLs**
- Build explorer links from configured chain.

12. **Cleanup unused modal/hook surfaces**
- Remove or wire currently unused modal sets to reduce drift.

---

## 10. Recommended Execution Sequence

1. ABI parity fix.
2. Tuple decode fix.
3. Escrow lifecycle wiring.
4. Direct withdraw/cancel wiring.
5. Escrow cancellation/refund path.
6. Event coverage improvements.
7. Documentation/route polish.

---

## 11. Key Risks if Work Is Not Done

- Escrow groups will continue to render incorrect data and mislead users.
- Direct mode users can settle but cannot complete payout claim inside UI.
- Contract/UI drift will keep increasing as Solidity evolves.
- Demo reliability is at risk for escrow-heavy scenarios.

---

## 12. Notes

- This audit intentionally used Solidity contracts as final source of truth.
- No code changes were made during this audit beyond creating this report file.

