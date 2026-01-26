/**
 * GroupEscrow Contract ABI
 * Pre-funded mode — members deposit upfront, expenses debit/credit internal balances
 */

/**
 * Group state in Escrow mode
 */
export enum GroupState {
    Pending = 0,  // Waiting for all deposits
    Active = 1,   // All deposited, can create expenses
    Closed = 2,   // Unanimously closed, can withdraw
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
 * GroupEscrow ABI - subset of functions used by frontend
 */
export const groupEscrowAbi = [
    // Deposit Phase
    {
        type: "function",
        name: "deposit",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
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
    // Close Flow
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
    {
        type: "function",
        name: "cancelClose",
        inputs: [],
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
        name: "hasVotedClose",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
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
    {
        type: "function",
        name: "closeVoteCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    // Events
    {
        type: "event",
        name: "Deposited",
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
        name: "CloseProposed",
        inputs: [{ name: "proposer", type: "address", indexed: true }],
    },
    {
        type: "event",
        name: "CloseVoted",
        inputs: [
            { name: "voter", type: "address", indexed: true },
            { name: "voteCount", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "CloseCancelled",
        inputs: [],
    },
    {
        type: "event",
        name: "GroupClosed",
        inputs: [],
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
