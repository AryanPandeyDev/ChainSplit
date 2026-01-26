/**
 * ChainSplitFactory Contract ABI and Address
 * Auto-extracted from smart_contracts/out/ChainSplitFactory.sol/ChainSplitFactory.json
 */

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;

/**
 * Group settlement modes
 */
export enum GroupMode {
    Direct = 0,
    Escrow = 1,
}

/**
 * ChainSplitFactory ABI - subset of functions used by frontend
 */
export const factoryAbi = [
    {
        type: "function",
        name: "createDirectGroup",
        inputs: [
            { name: "_name", type: "string" },
            { name: "_token", type: "address" },
            { name: "_members", type: "address[]" },
        ],
        outputs: [{ name: "group", type: "address" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "createEscrowGroup",
        inputs: [
            { name: "_name", type: "string" },
            { name: "_token", type: "address" },
            { name: "_members", type: "address[]" },
            { name: "_requiredDeposit", type: "uint256" },
            { name: "_depositDeadline", type: "uint256" },
        ],
        outputs: [{ name: "group", type: "address" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "getGroupsByUser",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getGroupMode",
        inputs: [{ name: "group", type: "address" }],
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getGroupsPaginated",
        inputs: [
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
        ],
        outputs: [{ name: "groups", type: "address[]" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getGroupCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getAllGroups",
        inputs: [],
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
    },
    // Events
    {
        type: "event",
        name: "DirectGroupCreated",
        inputs: [
            { name: "group", type: "address", indexed: true },
            { name: "creator", type: "address", indexed: true },
            { name: "name", type: "string", indexed: false },
            { name: "token", type: "address", indexed: false },
            { name: "memberCount", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "EscrowGroupCreated",
        inputs: [
            { name: "group", type: "address", indexed: true },
            { name: "creator", type: "address", indexed: true },
            { name: "name", type: "string", indexed: false },
            { name: "token", type: "address", indexed: false },
            { name: "memberCount", type: "uint256", indexed: false },
            { name: "requiredDeposit", type: "uint256", indexed: false },
            { name: "depositDeadline", type: "uint256", indexed: false },
        ],
    },
] as const;
