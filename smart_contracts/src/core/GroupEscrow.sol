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
 * @title GroupEscrow
 * @notice Escrow-mode group expense settlement contract.
 * @dev One instance per group. Created by ChainSplitFactory.
 *
 * Settlement Rules (from docs/SETTLEMENT_RULES.md):
 * - All members must deposit before group activates
 * - Deposits are locked until group closes
 * - Expenses settle via balance updates when all accept
 * - Withdrawal only after unanimous close vote
 *
 * Security (from docs/SECURITY_BASELINE.md):
 * - ReentrancyGuard on withdrawals
 * - SafeERC20 for all token transfers
 * - Checks-Effects-Interactions pattern
 * - Pull payment pattern only
 */
contract GroupEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ExpenseLib for uint256;

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    /// @notice Group lifecycle states
    enum GroupState {
        Pending, // Awaiting deposits
        Active, // All deposited, expenses allowed
        ClosePending, // Close proposed, collecting votes
        Closed, // Unanimous vote, withdrawals enabled
        Cancelled // Deadline passed or manually cancelled, refunds enabled
    }

    /// @notice Expense lifecycle states
    enum ExpenseState {
        Created, // Awaiting acceptances
        Settled, // All accepted, balances updated
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

    // Group metadata
    string public name;
    IERC20 public immutable TOKEN;
    address public immutable CREATOR;
    uint256 public immutable REQUIRED_DEPOSIT;
    uint256 public immutable DEPOSIT_DEADLINE;
    uint256 public immutable MAX_MEMBERS;

    // Group state
    GroupState public state;
    bool public closeProposed;

    // Members
    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => bool) public hasDeposited;
    mapping(address => bool) public closeVotes;
    uint256 public depositCount;

    // Balances (initialized to deposit amount when deposited)
    mapping(address => uint256) public balances;

    // Expenses
    uint256 public expenseCount;
    mapping(uint256 => Expense) internal _expenses;
    mapping(uint256 => address[]) internal _expenseParticipants;
    mapping(uint256 => uint256[]) internal _expenseShares;
    mapping(uint256 => mapping(address => bool)) public hasAccepted;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event DepositReceived(address indexed member, uint256 amount);
    event GroupActivated();
    event GroupCancelled();
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
    event CloseProposed(address indexed proposer);
    event CloseVoted(address indexed voter);
    event GroupClosed();
    event Withdrawn(address indexed member, uint256 amount);
    event DepositRefunded(address indexed member, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error GroupEscrow__NotMember();
    error GroupEscrow__NotDeposited();
    error GroupEscrow__AlreadyDeposited();
    error GroupEscrow__IncorrectDepositAmount();
    error GroupEscrow__DeadlinePassed();
    error GroupEscrow__DeadlineNotPassed();
    error GroupEscrow__InvalidState(GroupState expected, GroupState actual);
    error GroupEscrow__NotPayer();
    error GroupEscrow__AlreadyAccepted();
    error GroupEscrow__InsufficientBalance(uint256 required, uint256 available);
    error GroupEscrow__AlreadyVoted();
    error GroupEscrow__NoBalanceToWithdraw();
    error GroupEscrow__ExpenseNotFound();
    error GroupEscrow__InvalidExpenseState();
    error GroupEscrow__InvalidParticipant();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyMember() {
        _checkMember();
        _;
    }

    modifier onlyDeposited() {
        _checkDeposited();
        _;
    }

    modifier onlyState(GroupState expected) {
        _checkState(expected);
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
        if (!isMember[msg.sender]) revert GroupEscrow__NotMember();
    }

    function _checkDeposited() internal view {
        if (!hasDeposited[msg.sender]) revert GroupEscrow__NotDeposited();
    }

    function _checkState(GroupState expected) internal view {
        if (state != expected)
            revert GroupEscrow__InvalidState(expected, state);
    }

    function _checkPayer(uint256 expenseId) internal view {
        if (_expenses[expenseId].payer != msg.sender)
            revert GroupEscrow__NotPayer();
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new escrow group.
     * @param _name Human-readable group name
     * @param _token ERC20 token for deposits and settlements
     * @param _members Array of member addresses (must include creator)
     * @param _requiredDeposit Amount each member must deposit
     * @param _depositDeadline Unix timestamp after which group is cancelled
     * @param _creator Address that initiated group creation
     */
    constructor(
        string memory _name,
        address _token,
        address[] memory _members,
        uint256 _requiredDeposit,
        uint256 _depositDeadline,
        address _creator
    ) {
        require(bytes(_name).length > 0, "Empty name");
        require(_token != address(0), "Invalid token");
        require(_members.length >= 2, "Need at least 2 members");
        require(_members.length <= 20, "Max 20 members");
        require(_requiredDeposit > 0, "Zero deposit");
        require(_depositDeadline > block.timestamp, "Deadline in past");

        name = _name;
        TOKEN = IERC20(_token);
        REQUIRED_DEPOSIT = _requiredDeposit;
        DEPOSIT_DEADLINE = _depositDeadline;
        CREATOR = _creator;
        MAX_MEMBERS = _members.length;
        state = GroupState.Pending;

        // Register members (no duplicates check - factory should validate)
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
                          DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit required amount to join the group.
     * @dev Auto-activates group when all members have deposited.
     *      Uses SafeERC20 and checks actual received amount for
     *      fee-on-transfer token compatibility.
     */
    function deposit() external onlyMember onlyState(GroupState.Pending) {
        if (hasDeposited[msg.sender]) revert GroupEscrow__AlreadyDeposited();
        if (block.timestamp > DEPOSIT_DEADLINE)
            revert GroupEscrow__DeadlinePassed();

        // Check balance before transfer
        uint256 balanceBefore = TOKEN.balanceOf(address(this));

        // Transfer tokens from sender
        TOKEN.safeTransferFrom(msg.sender, address(this), REQUIRED_DEPOSIT);

        // Verify actual received amount (handles fee-on-transfer tokens)
        uint256 received = TOKEN.balanceOf(address(this)) - balanceBefore;
        if (received != REQUIRED_DEPOSIT)
            revert GroupEscrow__IncorrectDepositAmount();

        // Update state
        hasDeposited[msg.sender] = true;
        balances[msg.sender] = REQUIRED_DEPOSIT;
        depositCount++;

        emit DepositReceived(msg.sender, REQUIRED_DEPOSIT);

        // Check if all members deposited -> activate group
        if (depositCount == members.length) {
            state = GroupState.Active;
            emit GroupActivated();
        }
    }

    /**
     * @notice Cancel the group before activation.
     * @dev Can be called by any member while group is Pending.
     *      Triggers refunds for all depositors.
     */
    function cancelGroup() external onlyMember onlyState(GroupState.Pending) {
        state = GroupState.Cancelled;
        emit GroupCancelled();
    }

    /**
     * @notice Check and cancel group if deadline has passed.
     * @dev Can be called by anyone. Useful for cleanup.
     */
    function checkDeadline() external onlyState(GroupState.Pending) {
        if (block.timestamp <= DEPOSIT_DEADLINE)
            revert GroupEscrow__DeadlineNotPassed();
        state = GroupState.Cancelled;
        emit GroupCancelled();
    }

    /**
     * @notice Refund deposit after group cancellation.
     * @dev Pull payment pattern - depositor must claim their refund.
     */
    function refundDeposit() external nonReentrant onlyMember {
        if (state != GroupState.Cancelled)
            revert GroupEscrow__InvalidState(GroupState.Cancelled, state);
        if (!hasDeposited[msg.sender]) revert GroupEscrow__NotDeposited();

        uint256 amount = balances[msg.sender];
        if (amount == 0) revert GroupEscrow__NoBalanceToWithdraw();

        // Effects before interactions
        balances[msg.sender] = 0;
        hasDeposited[msg.sender] = false;

        // Transfer
        TOKEN.safeTransfer(msg.sender, amount);

        emit DepositRefunded(msg.sender, amount);
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
     * @dev Only callable when group is Active.
     *      All participants must be deposited members.
     *      Payer (msg.sender) can be included in participants.
     */
    function createExpense(
        uint256 amount,
        address[] calldata participants,
        uint256[] calldata shares,
        string calldata ipfsCid
    )
        external
        onlyDeposited
        onlyState(GroupState.Active)
        returns (uint256 expenseId)
    {
        // Validate inputs
        require(bytes(ipfsCid).length > 0, "Empty IPFS CID");
        ExpenseLib.validateArrayLengths(participants.length, shares.length);
        ExpenseLib.validateShares(amount, shares);

        // Validate all participants are deposited members
        for (uint256 i = 0; i < participants.length; ) {
            if (!hasDeposited[participants[i]])
                revert GroupEscrow__InvalidParticipant();
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
     *      Participant must have sufficient balance.
     *      Auto-settles when all required acceptances received.
     */
    function acceptExpense(
        uint256 expenseId
    ) external onlyDeposited onlyState(GroupState.Active) {
        Expense storage expense = _expenses[expenseId];
        if (expense.payer == address(0)) revert GroupEscrow__ExpenseNotFound();
        if (expense.state != ExpenseState.Created)
            revert GroupEscrow__InvalidExpenseState();
        if (expense.payer == msg.sender) revert GroupEscrow__NotPayer(); // Payer can't accept own expense
        if (hasAccepted[expenseId][msg.sender])
            revert GroupEscrow__AlreadyAccepted();

        // Find participant's share
        address[] storage participants = _expenseParticipants[expenseId];
        uint256[] storage shares = _expenseShares[expenseId];

        uint256 shareAmount = 0;
        bool isParticipant = false;

        for (uint256 i = 0; i < participants.length; ) {
            if (participants[i] == msg.sender) {
                shareAmount = shares[i];
                isParticipant = true;
                break;
            }
            unchecked {
                ++i;
            }
        }

        if (!isParticipant) revert GroupEscrow__InvalidParticipant();

        // Check sufficient balance (Escrow rule: block if insufficient)
        if (balances[msg.sender] < shareAmount) {
            revert GroupEscrow__InsufficientBalance(
                shareAmount,
                balances[msg.sender]
            );
        }

        // Record acceptance
        hasAccepted[expenseId][msg.sender] = true;
        expense.acceptedCount++;

        emit ExpenseAccepted(expenseId, msg.sender);

        // Check if all required acceptances received
        bool payerIsParticipant = false;
        for (uint256 i = 0; i < participants.length; ) {
            if (participants[i] == expense.payer) {
                payerIsParticipant = true;
                break;
            }
            unchecked {
                ++i;
            }
        }

        uint256 required = ExpenseLib.requiredAcceptanceCount(
            participants.length,
            payerIsParticipant
        );

        if (expense.acceptedCount >= required) {
            _settleExpense(expenseId);
        }
    }

    /**
     * @notice Cancel an expense before settlement.
     * @param expenseId The expense to cancel
     * @dev Only payer can cancel. Only before settlement.
     */
    function cancelExpense(
        uint256 expenseId
    ) external onlyDeposited onlyPayer(expenseId) {
        Expense storage expense = _expenses[expenseId];
        if (expense.state != ExpenseState.Created)
            revert GroupEscrow__InvalidExpenseState();

        expense.state = ExpenseState.Cancelled;
        emit ExpenseCancelled(expenseId);
    }

    /**
     * @notice Internal function to settle an expense.
     * @param expenseId The expense to settle
     * @dev Updates balances atomically. No token transfers.
     *      Debit participants, credit payer for non-payer shares.
     */
    function _settleExpense(uint256 expenseId) internal {
        Expense storage expense = _expenses[expenseId];
        address[] storage participants = _expenseParticipants[expenseId];
        uint256[] storage shares = _expenseShares[expenseId];

        address payer = expense.payer;
        uint256 payerCredit = 0;

        for (uint256 i = 0; i < participants.length; ) {
            address participant = participants[i];
            uint256 share = shares[i];

            if (participant != payer) {
                // Debit participant (already validated sufficient balance)
                balances[participant] -= share;
                payerCredit += share;
            }
            unchecked {
                ++i;
            }
        }

        // Credit payer with sum of non-payer shares
        balances[payer] += payerCredit;

        expense.state = ExpenseState.Settled;
        emit ExpenseSettled(expenseId);
    }

    /*//////////////////////////////////////////////////////////////
                        CLOSURE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Propose closing the group.
     * @dev Any deposited member can propose.
     *      Proposer's vote is automatically counted.
     */
    function proposeClose()
        external
        onlyDeposited
        onlyState(GroupState.Active)
    {
        if (closeProposed) {
            // Already proposed by someone else, just vote
            _voteClose();
            return;
        }

        closeProposed = true;
        closeVotes[msg.sender] = true;
        state = GroupState.ClosePending;

        emit CloseProposed(msg.sender);
        emit CloseVoted(msg.sender);

        _checkUnanimousClose();
    }

    /**
     * @notice Vote to close the group.
     * @dev Must be in ClosePending state.
     */
    function voteClose()
        external
        onlyDeposited
        onlyState(GroupState.ClosePending)
    {
        _voteClose();
    }

    /**
     * @dev Internal vote logic.
     */
    function _voteClose() internal {
        if (closeVotes[msg.sender]) revert GroupEscrow__AlreadyVoted();

        closeVotes[msg.sender] = true;
        emit CloseVoted(msg.sender);

        _checkUnanimousClose();
    }

    /**
     * @dev Check if all members voted and close if unanimous.
     */
    function _checkUnanimousClose() internal {
        for (uint256 i = 0; i < members.length; ) {
            if (!closeVotes[members[i]]) {
                return; // Not unanimous yet
            }
            unchecked {
                ++i;
            }
        }

        // All voted - close the group
        state = GroupState.Closed;
        emit GroupClosed();
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraw final balance after group closes.
     * @dev Pull payment pattern. Only after Closed state.
     *      ReentrancyGuard protects against reentrancy.
     */
    function withdraw() external nonReentrant onlyDeposited {
        if (state != GroupState.Closed)
            revert GroupEscrow__InvalidState(GroupState.Closed, state);

        uint256 amount = balances[msg.sender];
        if (amount == 0) revert GroupEscrow__NoBalanceToWithdraw();

        // Effects before interactions
        balances[msg.sender] = 0;

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
     * @return _state Current group state
     * @return _memberCount Number of members
     * @return _depositCount Number of deposits received
     */
    function getGroupInfo()
        external
        view
        returns (
            string memory _name,
            address _token,
            GroupState _state,
            uint256 _memberCount,
            uint256 _depositCount
        )
    {
        return (name, address(TOKEN), state, members.length, depositCount);
    }
}
