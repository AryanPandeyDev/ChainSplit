/**
 * GroupEscrow Contract ABI
 * Pre-funded mode — members deposit upfront, expenses debit/credit internal balances
 *
 * Source of truth: smart_contracts/src/core/GroupEscrow.sol
 */

/**
 * Group state in Escrow mode
 * Must match GroupEscrow.GroupState enum exactly
 */
export enum GroupState {
    Pending = 0,      // Awaiting deposits
    Active = 1,       // All deposited, can create expenses
    ClosePending = 2, // Close proposed, collecting votes
    Closed = 3,       // Unanimous vote, withdrawals enabled
    Cancelled = 4,    // Deadline passed or manually cancelled, refunds enabled
}

/**
 * Expense state (same as Direct mode)
 */
export enum EscrowExpenseState {
    Created = 0,
    Settled = 1,
    Cancelled = 2,
}

/**
 * GroupEscrow ABI — matches GroupEscrow.sol exactly
 */
export const groupEscrowAbi = [
    // ========================================================================
    // Deposit Phase
    // ========================================================================
    {
        type: "function",
        name: "deposit",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "cancelGroup",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "checkDeadline",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "refundDeposit",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },

    // ========================================================================
    // Expense Flow
    // ========================================================================
    {
        type: "function",
        name: "createExpense",
        inputs: [
            { name: "amount", type: "uint256" },
            { name: "participants", type: "address[]" },
            { name: "shares", type: "uint256[]" },
            { name: "ipfsCid", type: "string" },
        ],
        outputs: [{ name: "expenseId", type: "uint256" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "acceptExpense",
        inputs: [{ name: "expenseId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "cancelExpense",
        inputs: [{ name: "expenseId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },

    // ========================================================================
    // Close Flow
    // ========================================================================
    {
        type: "function",
        name: "proposeClose",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "voteClose",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },

    // ========================================================================
    // Withdrawal
    // ========================================================================
    {
        type: "function",
        name: "withdraw",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },

    // ========================================================================
    // View Functions
    // ========================================================================
    {
        type: "function",
        name: "name",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "state",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "balances",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "hasDeposited",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "closeVotes",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "hasAccepted",
        inputs: [
            { name: "expenseId", type: "uint256" },
            { name: "member", type: "address" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "isMember",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "members",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "depositCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "expenseCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "closeProposed",
        inputs: [],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "REQUIRED_DEPOSIT",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "DEPOSIT_DEADLINE",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "TOKEN",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getGroupInfo",
        inputs: [],
        outputs: [
            { name: "_name", type: "string" },
            { name: "_token", type: "address" },
            { name: "_state", type: "uint8" },
            { name: "_memberCount", type: "uint256" },
            { name: "_depositCount", type: "uint256" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getExpense",
        inputs: [{ name: "expenseId", type: "uint256" }],
        outputs: [
            { name: "payer", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "ipfsCid", type: "string" },
            { name: "state", type: "uint8" },
            { name: "acceptedCount", type: "uint256" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getExpenseParticipants",
        inputs: [{ name: "expenseId", type: "uint256" }],
        outputs: [
            { name: "participants", type: "address[]" },
            { name: "shares", type: "uint256[]" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getMembers",
        inputs: [],
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
    },

    // ========================================================================
    // Events (must match GroupEscrow.sol exactly)
    // ========================================================================
    {
        type: "event",
        name: "DepositReceived",
        inputs: [
            { name: "member", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "GroupActivated",
        inputs: [],
    },
    {
        type: "event",
        name: "GroupCancelled",
        inputs: [],
    },
    {
        type: "event",
        name: "ExpenseCreated",
        inputs: [
            { name: "expenseId", type: "uint256", indexed: true },
            { name: "payer", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "ipfsCid", type: "string", indexed: false },
        ],
    },
    {
        type: "event",
        name: "ExpenseAccepted",
        inputs: [
            { name: "expenseId", type: "uint256", indexed: true },
            { name: "participant", type: "address", indexed: true },
        ],
    },
    {
        type: "event",
        name: "ExpenseSettled",
        inputs: [
            { name: "expenseId", type: "uint256", indexed: true },
        ],
    },
    {
        type: "event",
        name: "ExpenseCancelled",
        inputs: [
            { name: "expenseId", type: "uint256", indexed: true },
        ],
    },
    {
        type: "event",
        name: "CloseProposed",
        inputs: [{ name: "proposer", type: "address", indexed: true }],
    },
    {
        type: "event",
        name: "CloseVoted",
        inputs: [
            { name: "voter", type: "address", indexed: true },
        ],
    },
    {
        type: "event",
        name: "GroupClosed",
        inputs: [],
    },
    {
        type: "event",
        name: "Withdrawn",
        inputs: [
            { name: "member", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "DepositRefunded",
        inputs: [
            { name: "member", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
] as const;
