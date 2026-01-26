/**
 * Custom hooks for ChainSplit
 */

export { useWallet } from "./useWallet";
export type { UseWalletReturn } from "./useWallet";

export {
    useUserGroups,
    useGroupMode,
    useGroupCount,
    useGroupsPaginated,
    useCreateDirectGroup,
    useCreateEscrowGroup,
    useCreateGroup,
} from "./useGroups";

export {
    // Group info
    useGroupInfo,
    useGroupBalance,
    useWithdrawableBalance,
    // Expenses
    useExpense,
    useExpenseParticipants,
    useCreateExpense,
    useAcceptExpense,
    useSettleExpense,
    useCancelExpense,
    // Withdrawals
    useWithdraw,
    // Escrow-specific
    useHasDeposited,
    useGroupState,
    useDeposit,
    useProposeClose,
    useVoteClose,
    // ERC20
    useTokenBalance,
    useTokenAllowance,
    useTokenInfo,
    useTokenApprove,
} from "./useContracts";
