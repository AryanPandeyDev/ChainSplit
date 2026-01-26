/**
 * GroupDirect Contract ABI
 * Pull-based settlement mode — no deposits, payer pulls funds via transferFrom
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
 * GroupDirect ABI - subset of functions used by frontend
 */
export const groupDirectAbi = [
    // Expense Flow
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
    // Withdrawal
    {
        type: "function",
        name: "withdraw",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    // View Functions
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
        name: "getGroupInfo",
        inputs: [],
        outputs: [
            { name: "name", type: "string" },
            { name: "token", type: "address" },
            { name: "memberCount", type: "uint256" },
            { name: "expenseCount", type: "uint256" },
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
            { name: "", type: "address[]" },
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
        name: "TOKEN",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "NAME",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
    },
    // Events
    {
        type: "event",
        name: "ExpenseCreated",
        inputs: [
            { name: "expenseId", type: "uint256", indexed: true },
            { name: "payer", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "participantCount", type: "uint256", indexed: false },
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
            { name: "payer", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "ExpenseCancelled",
        inputs: [{ name: "expenseId", type: "uint256", indexed: true }],
    },
    {
        type: "event",
        name: "Withdrawal",
        inputs: [
            { name: "member", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
        ],
    },
] as const;
