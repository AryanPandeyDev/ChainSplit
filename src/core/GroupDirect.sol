// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ExpenseLib} from "../libraries/ExpenseLib.sol";

/**
 * @title GroupDirect
 * @notice Direct settlement mode for group expenses.
 * @dev One instance per group. Created by ChainSplitFactory.
 *
 * Settlement Rules (from docs/SETTLEMENT_RULES.md):
 * - No upfront deposits required
 * - Balances can be negative (represents debt)
 * - Settlement via transferFrom when payer calls settle
 * - Withdrawal of positive balance anytime
 *
 * Security (from docs/SECURITY_BASELINE.md):
 * - ReentrancyGuard on settlement and withdrawals
 * - SafeERC20 for all token transfers
 * - Checks-Effects-Interactions pattern
 * - Atomic settlement (all-or-nothing)
 */
contract GroupDirect is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ExpenseLib for uint256;

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    /// @notice Expense lifecycle states
    enum ExpenseState {
        Created, // Awaiting acceptances
        Settled, // All accepted and funds transferred
        Cancelled // Payer cancelled before settlement
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Core expense data
    struct Expense {
        address payer;
        uint256 amount;
        string ipfsCid;
        ExpenseState state;
        uint256 acceptedCount;
        uint256 createdAt;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    // Group metadata (immutable)
    string public name;
    IERC20 public immutable TOKEN;
    address public immutable CREATOR;

    // Members
    address[] public members;
    mapping(address => bool) public isMember;

    // Balances: int256 because Direct mode can have negative balances (debt)
    // Positive = can withdraw, Negative = owes money
    mapping(address => int256) public balances;

    // Accumulated credits waiting to be withdrawn
    // When settlement happens, payer receives tokens which are held here
    mapping(address => uint256) public withdrawableBalance;

    // Expenses
    uint256 public expenseCount;
    mapping(uint256 => Expense) internal _expenses;
    mapping(uint256 => address[]) internal _expenseParticipants;
    mapping(uint256 => uint256[]) internal _expenseShares;
    mapping(uint256 => mapping(address => bool)) public hasAccepted;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event ExpenseCreated(
        uint256 indexed expenseId,
        address indexed payer,
        uint256 amount,
        string ipfsCid
    );
    event ExpenseAccepted(
        uint256 indexed expenseId,
        address indexed participant
    );
    event ExpenseSettled(uint256 indexed expenseId);
    event ExpenseCancelled(uint256 indexed expenseId);
    event BalanceUpdated(
        address indexed member,
        int256 oldBalance,
        int256 newBalance
    );
    event Withdrawn(address indexed member, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error GroupDirect__NotMember();
    error GroupDirect__NotPayer();
    error GroupDirect__AlreadyAccepted();
    error GroupDirect__NotAllAccepted();
    error GroupDirect__AlreadySettled();
    error GroupDirect__InvalidExpenseState();
    error GroupDirect__ExpenseNotFound();
    error GroupDirect__InvalidParticipant();
    error GroupDirect__NoBalanceToWithdraw();
    error GroupDirect__TransferFailed(address participant);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyMember() {
        _checkMember();
        _;
    }

    modifier onlyPayer(uint256 expenseId) {
        _checkPayer(expenseId);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL CHECKS
    //////////////////////////////////////////////////////////////*/

    function _checkMember() internal view {
        if (!isMember[msg.sender]) revert GroupDirect__NotMember();
    }

    function _checkPayer(uint256 expenseId) internal view {
        if (_expenses[expenseId].payer != msg.sender)
            revert GroupDirect__NotPayer();
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new direct settlement group.
     * @param _name Human-readable group name
     * @param _token ERC20 token for settlements
     * @param _members Array of member addresses
     * @param _creator Address that initiated group creation
     */
    constructor(
        string memory _name,
        address _token,
        address[] memory _members,
        address _creator
    ) {
        require(bytes(_name).length > 0, "Empty name");
        require(_token != address(0), "Invalid token");
        require(_members.length >= 2, "Need at least 2 members");
        require(_members.length <= 20, "Max 20 members");

        name = _name;
        TOKEN = IERC20(_token);
        CREATOR = _creator;

        // Register members
        for (uint256 i = 0; i < _members.length; ) {
            address member = _members[i];
            require(member != address(0), "Invalid member address");
            require(!isMember[member], "Duplicate member");

            members.push(member);
            isMember[member] = true;

            unchecked {
                ++i;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          EXPENSE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new expense.
     * @param amount Total expense amount
     * @param participants Array of addresses who share the cost
     * @param shares Array of share amounts (must sum to amount)
     * @param ipfsCid IPFS content identifier for receipt
     * @return expenseId The ID of the created expense
     * @dev All participants must be group members.
     *      Payer (msg.sender) can be included in participants.
     */
    function createExpense(
        uint256 amount,
        address[] calldata participants,
        uint256[] calldata shares,
        string calldata ipfsCid
    ) external onlyMember returns (uint256 expenseId) {
        // Validate inputs
        require(bytes(ipfsCid).length > 0, "Empty IPFS CID");
        ExpenseLib.validateArrayLengths(participants.length, shares.length);
        ExpenseLib.validateShares(amount, shares);

        // Validate all participants are members
        for (uint256 i = 0; i < participants.length; ) {
            if (!isMember[participants[i]])
                revert GroupDirect__InvalidParticipant();
            unchecked {
                ++i;
            }
        }

        // Create expense
        expenseId = expenseCount++;

        _expenses[expenseId] = Expense({
            payer: msg.sender,
            amount: amount,
            ipfsCid: ipfsCid,
            state: ExpenseState.Created,
            acceptedCount: 0,
            createdAt: block.timestamp
        });

        // Store participants and shares
        for (uint256 i = 0; i < participants.length; ) {
            _expenseParticipants[expenseId].push(participants[i]);
            _expenseShares[expenseId].push(shares[i]);
            unchecked {
                ++i;
            }
        }

        emit ExpenseCreated(expenseId, msg.sender, amount, ipfsCid);
    }

    /**
     * @notice Accept an expense share.
     * @param expenseId The expense to accept
     * @dev Payer cannot accept their own expense.
     *      Participant should have approved the contract for their share.
     *      Approval is not checked here - checked at settlement time.
     */
    function acceptExpense(uint256 expenseId) external onlyMember {
        Expense storage expense = _expenses[expenseId];
        if (expense.payer == address(0)) revert GroupDirect__ExpenseNotFound();
        if (expense.state != ExpenseState.Created)
            revert GroupDirect__InvalidExpenseState();
        if (expense.payer == msg.sender) revert GroupDirect__NotPayer(); // Payer can't accept own expense
        if (hasAccepted[expenseId][msg.sender])
            revert GroupDirect__AlreadyAccepted();

        // Verify sender is a participant
        address[] storage participants = _expenseParticipants[expenseId];
        bool isParticipant = false;

        for (uint256 i = 0; i < participants.length; ) {
            if (participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
            unchecked {
                ++i;
            }
        }

        if (!isParticipant) revert GroupDirect__InvalidParticipant();

        // Record acceptance
        hasAccepted[expenseId][msg.sender] = true;
        expense.acceptedCount++;

        emit ExpenseAccepted(expenseId, msg.sender);
    }

    /**
     * @notice Settle an expense by pulling funds from all participants.
     * @param expenseId The expense to settle
     * @dev Only payer can settle. All non-payer participants must have accepted.
     *      Uses transferFrom to pull each participant's share.
     *      If any transfer fails, entire settlement reverts (atomic).
     *
     * Security: ReentrancyGuard + Checks-Effects-Interactions pattern
     */
    function settleExpense(
        uint256 expenseId
    ) external nonReentrant onlyMember onlyPayer(expenseId) {
        Expense storage expense = _expenses[expenseId];
        if (expense.state != ExpenseState.Created)
            revert GroupDirect__InvalidExpenseState();

        address[] storage participants = _expenseParticipants[expenseId];
        uint256[] storage shares = _expenseShares[expenseId];
        address payer = expense.payer;

        // Check all required acceptances
        bool payerIsParticipant = false;
        for (uint256 i = 0; i < participants.length; ) {
            address participant = participants[i];

            if (participant == payer) {
                payerIsParticipant = true;
            } else {
                // Non-payer participants must have accepted
                if (!hasAccepted[expenseId][participant]) {
                    revert GroupDirect__NotAllAccepted();
                }
            }
            unchecked {
                ++i;
            }
        }

        uint256 requiredAcceptances = ExpenseLib.requiredAcceptanceCount(
            participants.length,
            payerIsParticipant
        );

        if (expense.acceptedCount < requiredAcceptances) {
            revert GroupDirect__NotAllAccepted();
        }

        // EFFECTS: Update state BEFORE external calls
        expense.state = ExpenseState.Settled;

        // Track balance changes for events
        uint256 totalToTransfer = 0;

        // Update balances: debit participants, credit payer
        for (uint256 i = 0; i < participants.length; ) {
            address participant = participants[i];
            uint256 share = shares[i];

            if (participant != payer) {
                // Debit participant
                int256 oldBalance = balances[participant];
                // casting to 'int256' is safe because share amounts are realistic expense values
                // (e.g., max ~10^18 tokens) which never exceed int256.max (~5.7 * 10^76)
                // forge-lint: disable-next-line(unsafe-typecast)
                balances[participant] -= int256(share);
                emit BalanceUpdated(
                    participant,
                    oldBalance,
                    balances[participant]
                );

                totalToTransfer += share;
            }
            unchecked {
                ++i;
            }
        }

        // Credit payer
        if (totalToTransfer > 0) {
            int256 oldPayerBalance = balances[payer];
            // casting to 'int256' is safe because totalToTransfer is sum of participant shares,
            // bounded by realistic expense amounts, never exceeding int256.max
            // forge-lint: disable-next-line(unsafe-typecast)
            balances[payer] += int256(totalToTransfer);
            emit BalanceUpdated(payer, oldPayerBalance, balances[payer]);
        }

        // INTERACTIONS: Transfer tokens from participants to this contract
        // Payer receives tokens via withdrawableBalance
        for (uint256 i = 0; i < participants.length; ) {
            address participant = participants[i];
            uint256 share = shares[i];

            if (participant != payer) {
                // Pull tokens from participant
                // If this fails, the entire transaction reverts
                TOKEN.safeTransferFrom(participant, address(this), share);
            }
            unchecked {
                ++i;
            }
        }

        // Add transferred amount to payer's withdrawable balance
        withdrawableBalance[payer] += totalToTransfer;

        emit ExpenseSettled(expenseId);
    }

    /**
     * @notice Cancel an expense before settlement.
     * @param expenseId The expense to cancel
     * @dev Only payer can cancel. Only before settlement.
     */
    function cancelExpense(
        uint256 expenseId
    ) external onlyMember onlyPayer(expenseId) {
        Expense storage expense = _expenses[expenseId];
        if (expense.state != ExpenseState.Created)
            revert GroupDirect__InvalidExpenseState();

        expense.state = ExpenseState.Cancelled;
        emit ExpenseCancelled(expenseId);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraw accumulated balance from settled expenses.
     * @dev Pull payment pattern. Can withdraw anytime.
     *      ReentrancyGuard protects against reentrancy.
     */
    function withdraw() external nonReentrant onlyMember {
        uint256 amount = withdrawableBalance[msg.sender];
        if (amount == 0) revert GroupDirect__NoBalanceToWithdraw();

        // Effects before interactions
        withdrawableBalance[msg.sender] = 0;

        // Transfer
        TOKEN.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get expense details.
     * @param expenseId The expense ID
     * @return payer The expense payer
     * @return amount Total amount
     * @return ipfsCid IPFS CID for receipt
     * @return expenseState Current state
     * @return acceptedCount Number of acceptances
     */
    function getExpense(
        uint256 expenseId
    )
        external
        view
        returns (
            address payer,
            uint256 amount,
            string memory ipfsCid,
            ExpenseState expenseState,
            uint256 acceptedCount
        )
    {
        Expense storage expense = _expenses[expenseId];
        return (
            expense.payer,
            expense.amount,
            expense.ipfsCid,
            expense.state,
            expense.acceptedCount
        );
    }

    /**
     * @notice Get expense participants and shares.
     * @param expenseId The expense ID
     * @return participants Array of participant addresses
     * @return shares Array of share amounts
     */
    function getExpenseParticipants(
        uint256 expenseId
    )
        external
        view
        returns (address[] memory participants, uint256[] memory shares)
    {
        return (_expenseParticipants[expenseId], _expenseShares[expenseId]);
    }

    /**
     * @notice Get all group members.
     * @return Array of member addresses
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    /**
     * @notice Get group info.
     * @return _name Group name
     * @return _token Token address
     * @return _memberCount Number of members
     * @return _expenseCount Number of expenses
     */
    function getGroupInfo()
        external
        view
        returns (
            string memory _name,
            address _token,
            uint256 _memberCount,
            uint256 _expenseCount
        )
    {
        return (name, address(TOKEN), members.length, expenseCount);
    }

    /**
     * @notice Get member's net balance.
     * @param member The member address
     * @return Net balance (positive = credit, negative = debt)
     */
    function getBalance(address member) external view returns (int256) {
        return balances[member];
    }

    /**
     * @notice Get member's withdrawable balance.
     * @param member The member address
     * @return Amount available for withdrawal
     */
    function getWithdrawableBalance(
        address member
    ) external view returns (uint256) {
        return withdrawableBalance[member];
    }
}
