/**
 * GroupDirect Contract ABI
 * Pull-based settlement mode — no deposits, payer pulls funds via transferFrom
 *
 * Source of truth: smart_contracts/src/core/GroupDirect.sol
 */

/**
 * Expense state in Direct mode
 */
export enum ExpenseState {
    Created = 0,
    Settled = 1,
    Cancelled = 2,
}

/**
 * GroupDirect ABI — matches GroupDirect.sol exactly
 */
export const groupDirectAbi = [
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
        name: "settleExpense",
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
        name: "balances",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "int256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "withdrawableBalance",
        inputs: [{ name: "", type: "address" }],
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
        name: "getGroupInfo",
        inputs: [],
        outputs: [
            { name: "_name", type: "string" },
            { name: "_token", type: "address" },
            { name: "_memberCount", type: "uint256" },
            { name: "_expenseCount", type: "uint256" },
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
        name: "members",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
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
        name: "TOKEN",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getMembers",
        inputs: [],
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getBalance",
        inputs: [{ name: "member", type: "address" }],
        outputs: [{ name: "", type: "int256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getWithdrawableBalance",
        inputs: [{ name: "member", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },

    // ========================================================================
    // Events (must match GroupDirect.sol exactly)
    // ========================================================================
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
        inputs: [{ name: "expenseId", type: "uint256", indexed: true }],
    },
    {
        type: "event",
        name: "BalanceUpdated",
        inputs: [
            { name: "member", type: "address", indexed: true },
            { name: "oldBalance", type: "int256", indexed: false },
            { name: "newBalance", type: "int256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "Withdrawn",
        inputs: [
            { name: "member", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
] as const;
