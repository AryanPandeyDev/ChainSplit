// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GroupDirect} from "../../src/core/GroupDirect.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/**
 * @title GroupDirectTest
 * @notice Unit tests for GroupDirect contract
 * @dev Tests cover constructor validation, expense lifecycle,
 *      settlement mechanics, and balance invariants.
 */
contract GroupDirectTest is Test {
    GroupDirect public group;
    MockERC20 public token;

    address public alice;
    address public bob;
    address public charlie;
    address public stranger;

    uint256 public constant INITIAL_BALANCE = 10_000e6; // 10,000 tokens (6 decimals like USDC)
    uint256 public constant EXPENSE_AMOUNT = 300e6; // 300 tokens

    function setUp() public {
        // Create addresses
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        stranger = makeAddr("stranger");

        // Deploy mock token
        token = new MockERC20("Mock USDC", "mUSDC", 6);

        // Create group with alice, bob, charlie
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        group = new GroupDirect("Test Group", address(token), members, alice);

        // Fund members with tokens
        token.mint(alice, INITIAL_BALANCE);
        token.mint(bob, INITIAL_BALANCE);
        token.mint(charlie, INITIAL_BALANCE);

        // Members approve the group contract to spend their tokens
        vm.prank(alice);
        token.approve(address(group), type(uint256).max);

        vm.prank(bob);
        token.approve(address(group), type(uint256).max);

        vm.prank(charlie);
        token.approve(address(group), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                         CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_constructor_SetsCorrectState() public view {
        assertEq(group.name(), "Test Group");
        assertEq(address(group.TOKEN()), address(token));
        assertEq(group.CREATOR(), alice);

        address[] memory members = group.getMembers();
        assertEq(members.length, 3);
        assertEq(members[0], alice);
        assertEq(members[1], bob);
        assertEq(members[2], charlie);

        assertTrue(group.isMember(alice));
        assertTrue(group.isMember(bob));
        assertTrue(group.isMember(charlie));
        assertFalse(group.isMember(stranger));
    }

    function test_constructor_RevertsOnEmptyName() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        vm.expectRevert("Empty name");
        new GroupDirect("", address(token), members, alice);
    }

    function test_constructor_RevertsOnInvalidToken() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        vm.expectRevert("Invalid token");
        new GroupDirect("Test", address(0), members, alice);
    }

    function test_constructor_RevertsOnTooFewMembers() public {
        address[] memory members = new address[](1);
        members[0] = alice;

        vm.expectRevert("Need at least 2 members");
        new GroupDirect("Test", address(token), members, alice);
    }

    function test_constructor_RevertsOnTooManyMembers() public {
        address[] memory tooMany = new address[](21);
        for (uint256 i = 0; i < 21; i++) {
            // forge-lint: disable-next-line(unsafe-typecast)
            tooMany[i] = address(uint160(i + 1));
        }

        vm.expectRevert("Max 20 members");
        new GroupDirect("Test", address(token), tooMany, alice);
    }

    function test_constructor_RevertsOnDuplicateMembers() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = alice; // Duplicate

        vm.expectRevert("Duplicate member");
        new GroupDirect("Test", address(token), members, alice);
    }

    function test_constructor_RevertsOnZeroAddressMember() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = address(0);

        vm.expectRevert("Invalid member address");
        new GroupDirect("Test", address(token), members, alice);
    }

    /*//////////////////////////////////////////////////////////////
                       EXPENSE CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_createExpense_Success() public {
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = charlie;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 150e6;
        shares[1] = 150e6;

        vm.prank(alice);
        uint256 expenseId = group.createExpense(
            EXPENSE_AMOUNT,
            participants,
            shares,
            "QmTestCID123"
        );

        assertEq(expenseId, 0);
        assertEq(group.expenseCount(), 1);

        (
            address payer,
            uint256 amount,
            string memory ipfsCid,
            GroupDirect.ExpenseState expenseState,
            uint256 acceptedCount
        ) = group.getExpense(expenseId);

        assertEq(payer, alice);
        assertEq(amount, EXPENSE_AMOUNT);
        assertEq(ipfsCid, "QmTestCID123");
        assertEq(
            uint256(expenseState),
            uint256(GroupDirect.ExpenseState.Created)
        );
        assertEq(acceptedCount, 0);

        // Verify participants and shares stored correctly
        (
            address[] memory storedParticipants,
            uint256[] memory storedShares
        ) = group.getExpenseParticipants(expenseId);
        assertEq(storedParticipants.length, 2);
        assertEq(storedParticipants[0], bob);
        assertEq(storedParticipants[1], charlie);
        assertEq(storedShares[0], 150e6);
        assertEq(storedShares[1], 150e6);
    }

    function test_createExpense_PayerIsParticipant() public {
        // Payer can also be a participant (e.g., splitting dinner equally)
        address[] memory participants = new address[](3);
        participants[0] = alice; // Payer is also participant
        participants[1] = bob;
        participants[2] = charlie;

        uint256[] memory shares = new uint256[](3);
        shares[0] = 100e6;
        shares[1] = 100e6;
        shares[2] = 100e6;

        vm.prank(alice);
        uint256 expenseId = group.createExpense(
            300e6,
            participants,
            shares,
            "QmEqualSplit"
        );

        (address payer, uint256 amount, , , ) = group.getExpense(expenseId);
        assertEq(payer, alice);
        assertEq(amount, 300e6);
    }

    function test_createExpense_RevertsIfNotMember() public {
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = charlie;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 150e6;
        shares[1] = 150e6;

        vm.prank(stranger);
        vm.expectRevert(GroupDirect.GroupDirect__NotMember.selector);
        group.createExpense(EXPENSE_AMOUNT, participants, shares, "QmTest");
    }

    function test_createExpense_RevertsIfInvalidParticipant() public {
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = stranger; // Not a member

        uint256[] memory shares = new uint256[](2);
        shares[0] = 150e6;
        shares[1] = 150e6;

        vm.prank(alice);
        vm.expectRevert(GroupDirect.GroupDirect__InvalidParticipant.selector);
        group.createExpense(EXPENSE_AMOUNT, participants, shares, "QmTest");
    }

    function test_createExpense_RevertsIfEmptyIPFSCID() public {
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = charlie;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 150e6;
        shares[1] = 150e6;

        vm.prank(alice);
        vm.expectRevert("Empty IPFS CID");
        group.createExpense(EXPENSE_AMOUNT, participants, shares, "");
    }

    function test_createExpense_RevertsIfSharesMismatch() public {
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = charlie;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 100e6;
        shares[1] = 100e6; // Sum = 200, but amount = 300

        vm.prank(alice);
        vm.expectRevert(); // ExpenseLib validation will revert
        group.createExpense(EXPENSE_AMOUNT, participants, shares, "QmTest");
    }

    /*//////////////////////////////////////////////////////////////
                       EXPENSE ACCEPTANCE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_acceptExpense_SingleAcceptance() public {
        uint256 expenseId = _createTestExpense();

        assertFalse(group.hasAccepted(expenseId, bob));

        vm.prank(bob);
        group.acceptExpense(expenseId);

        assertTrue(group.hasAccepted(expenseId, bob));

        (, , , , uint256 acceptedCount) = group.getExpense(expenseId);
        assertEq(acceptedCount, 1);
    }

    function test_acceptExpense_MultipleAcceptances() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        assertTrue(group.hasAccepted(expenseId, bob));
        assertTrue(group.hasAccepted(expenseId, charlie));

        (, , , , uint256 acceptedCount) = group.getExpense(expenseId);
        assertEq(acceptedCount, 2);
    }

    function test_acceptExpense_RevertsIfPayer() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(alice); // Alice is the payer
        vm.expectRevert(GroupDirect.GroupDirect__NotPayer.selector);
        group.acceptExpense(expenseId);
    }

    function test_acceptExpense_RevertsIfAlreadyAccepted() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(bob);
        vm.expectRevert(GroupDirect.GroupDirect__AlreadyAccepted.selector);
        group.acceptExpense(expenseId);
    }

    function test_acceptExpense_RevertsIfNotParticipant() public {
        // Create expense with only bob as participant
        address[] memory participants = new address[](1);
        participants[0] = bob;

        uint256[] memory shares = new uint256[](1);
        shares[0] = EXPENSE_AMOUNT;

        vm.prank(alice);
        uint256 expenseId = group.createExpense(
            EXPENSE_AMOUNT,
            participants,
            shares,
            "QmTest"
        );

        // Charlie is not a participant
        vm.prank(charlie);
        vm.expectRevert(GroupDirect.GroupDirect__InvalidParticipant.selector);
        group.acceptExpense(expenseId);
    }

    function test_acceptExpense_RevertsIfNotMember() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(stranger);
        vm.expectRevert(GroupDirect.GroupDirect__NotMember.selector);
        group.acceptExpense(expenseId);
    }

    function test_acceptExpense_RevertsIfExpenseNotFound() public {
        vm.prank(bob);
        vm.expectRevert(GroupDirect.GroupDirect__ExpenseNotFound.selector);
        group.acceptExpense(999); // Non-existent expense
    }

    /*//////////////////////////////////////////////////////////////
                       EXPENSE SETTLEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_settleExpense_Success() public {
        uint256 expenseId = _createTestExpense();

        // Both participants accept
        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        // Record balances before settlement
        uint256 bobTokensBefore = token.balanceOf(bob);
        uint256 charlieTokensBefore = token.balanceOf(charlie);

        // Alice (payer) settles
        vm.prank(alice);
        group.settleExpense(expenseId);

        // Verify expense state changed
        (, , , GroupDirect.ExpenseState expenseState, ) = group.getExpense(
            expenseId
        );
        assertEq(
            uint256(expenseState),
            uint256(GroupDirect.ExpenseState.Settled)
        );

        // Verify token transfers occurred (participants paid their shares)
        assertEq(token.balanceOf(bob), bobTokensBefore - 150e6);
        assertEq(token.balanceOf(charlie), charlieTokensBefore - 150e6);

        // Tokens are now held in the contract for alice to withdraw
        assertEq(token.balanceOf(address(group)), 300e6);

        // Alice has withdrawable balance
        assertEq(group.getWithdrawableBalance(alice), 300e6);

        // Verify net balances updated
        assertEq(group.getBalance(alice), 300e6); // Credit
        assertEq(group.getBalance(bob), -150e6); // Debit
        assertEq(group.getBalance(charlie), -150e6); // Debit
    }

    function test_settleExpense_PayerIsParticipant() public {
        // Create expense where payer is also participant
        address[] memory participants = new address[](3);
        participants[0] = alice; // Payer is participant
        participants[1] = bob;
        participants[2] = charlie;

        uint256[] memory shares = new uint256[](3);
        shares[0] = 100e6; // Alice's share (won't be transferred)
        shares[1] = 100e6;
        shares[2] = 100e6;

        vm.prank(alice);
        uint256 expenseId = group.createExpense(
            300e6,
            participants,
            shares,
            "QmEqualSplit"
        );

        // Only bob and charlie need to accept (payer doesn't accept own expense)
        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        uint256 bobTokensBefore = token.balanceOf(bob);
        uint256 charlieTokensBefore = token.balanceOf(charlie);

        vm.prank(alice);
        group.settleExpense(expenseId);

        // Only bob and charlie's tokens transferred
        assertEq(token.balanceOf(bob), bobTokensBefore - 100e6);
        assertEq(token.balanceOf(charlie), charlieTokensBefore - 100e6);

        // Alice's withdrawable is only the OTHER participants' shares
        assertEq(group.getWithdrawableBalance(alice), 200e6);

        // Net balances (Alice only credited for others' shares)
        assertEq(group.getBalance(alice), 200e6);
        assertEq(group.getBalance(bob), -100e6);
        assertEq(group.getBalance(charlie), -100e6);
    }

    function test_settleExpense_RevertsIfNotAllAccepted() public {
        uint256 expenseId = _createTestExpense();

        // Only bob accepts (charlie hasn't)
        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(alice);
        vm.expectRevert(GroupDirect.GroupDirect__NotAllAccepted.selector);
        group.settleExpense(expenseId);
    }

    function test_settleExpense_RevertsIfNotPayer() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        // Bob tries to settle (not the payer)
        vm.prank(bob);
        vm.expectRevert(GroupDirect.GroupDirect__NotPayer.selector);
        group.settleExpense(expenseId);
    }

    function test_settleExpense_RevertsIfAlreadySettled() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        vm.prank(alice);
        group.settleExpense(expenseId);

        // Try to settle again
        vm.prank(alice);
        vm.expectRevert(GroupDirect.GroupDirect__InvalidExpenseState.selector);
        group.settleExpense(expenseId);
    }

    function test_settleExpense_RevertsIfCancelled() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        // Cancel first
        vm.prank(alice);
        group.cancelExpense(expenseId);

        // Try to settle
        vm.prank(alice);
        vm.expectRevert(GroupDirect.GroupDirect__InvalidExpenseState.selector);
        group.settleExpense(expenseId);
    }

    /*//////////////////////////////////////////////////////////////
                       EXPENSE CANCELLATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_cancelExpense_ByPayer() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(alice);
        group.cancelExpense(expenseId);

        (, , , GroupDirect.ExpenseState expenseState, ) = group.getExpense(
            expenseId
        );
        assertEq(
            uint256(expenseState),
            uint256(GroupDirect.ExpenseState.Cancelled)
        );
    }

    function test_cancelExpense_AfterAcceptances() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        // Payer can still cancel even after acceptances
        vm.prank(alice);
        group.cancelExpense(expenseId);

        (, , , GroupDirect.ExpenseState expenseState, ) = group.getExpense(
            expenseId
        );
        assertEq(
            uint256(expenseState),
            uint256(GroupDirect.ExpenseState.Cancelled)
        );
    }

    function test_cancelExpense_RevertsIfNotPayer() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        vm.expectRevert(GroupDirect.GroupDirect__NotPayer.selector);
        group.cancelExpense(expenseId);
    }

    function test_cancelExpense_RevertsIfAlreadySettled() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        vm.prank(alice);
        group.settleExpense(expenseId);

        // Try to cancel after settlement
        vm.prank(alice);
        vm.expectRevert(GroupDirect.GroupDirect__InvalidExpenseState.selector);
        group.cancelExpense(expenseId);
    }

    /*//////////////////////////////////////////////////////////////
                         WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_withdraw_AfterSettlement() public {
        uint256 expenseId = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expenseId);

        vm.prank(charlie);
        group.acceptExpense(expenseId);

        vm.prank(alice);
        group.settleExpense(expenseId);

        uint256 aliceTokensBefore = token.balanceOf(alice);
        uint256 contractBalanceBefore = token.balanceOf(address(group));

        vm.prank(alice);
        group.withdraw();

        assertEq(token.balanceOf(alice), aliceTokensBefore + 300e6);
        assertEq(
            token.balanceOf(address(group)),
            contractBalanceBefore - 300e6
        );
        assertEq(group.getWithdrawableBalance(alice), 0);
    }

    function test_withdraw_MultipleSettlementsThenWithdraw() public {
        // Settle first expense
        uint256 expense1 = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expense1);

        vm.prank(charlie);
        group.acceptExpense(expense1);

        vm.prank(alice);
        group.settleExpense(expense1);

        // Create and settle second expense
        address[] memory participants = new address[](1);
        participants[0] = bob;

        uint256[] memory shares = new uint256[](1);
        shares[0] = 100e6;

        vm.prank(alice);
        uint256 expense2 = group.createExpense(
            100e6,
            participants,
            shares,
            "QmTest2"
        );

        vm.prank(bob);
        group.acceptExpense(expense2);

        vm.prank(alice);
        group.settleExpense(expense2);

        // Alice should have 400e6 withdrawable (300 + 100)
        assertEq(group.getWithdrawableBalance(alice), 400e6);

        uint256 aliceTokensBefore = token.balanceOf(alice);

        vm.prank(alice);
        group.withdraw();

        assertEq(token.balanceOf(alice), aliceTokensBefore + 400e6);
    }

    function test_withdraw_RevertsIfNoBalance() public {
        vm.prank(bob); // Bob has no withdrawable balance
        vm.expectRevert(GroupDirect.GroupDirect__NoBalanceToWithdraw.selector);
        group.withdraw();
    }

    function test_withdraw_RevertsIfNotMember() public {
        vm.prank(stranger);
        vm.expectRevert(GroupDirect.GroupDirect__NotMember.selector);
        group.withdraw();
    }

    /*//////////////////////////////////////////////////////////////
                         INVARIANT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_invariant_BalancesSumToZero() public {
        // Create and settle multiple expenses in different directions

        // Expense 1: Alice pays, Bob and Charlie share
        uint256 expense1 = _createTestExpense();

        vm.prank(bob);
        group.acceptExpense(expense1);

        vm.prank(charlie);
        group.acceptExpense(expense1);

        vm.prank(alice);
        group.settleExpense(expense1);

        // Check invariant after first expense
        int256 sum1 = group.getBalance(alice) +
            group.getBalance(bob) +
            group.getBalance(charlie);
        assertEq(sum1, 0, "Invariant violated after expense 1");

        // Expense 2: Bob pays, Alice and Charlie share
        address[] memory participants2 = new address[](2);
        participants2[0] = alice;
        participants2[1] = charlie;

        uint256[] memory shares2 = new uint256[](2);
        shares2[0] = 100e6;
        shares2[1] = 100e6;

        vm.prank(bob);
        uint256 expense2 = group.createExpense(
            200e6,
            participants2,
            shares2,
            "QmTest2"
        );

        vm.prank(alice);
        group.acceptExpense(expense2);

        vm.prank(charlie);
        group.acceptExpense(expense2);

        vm.prank(bob);
        group.settleExpense(expense2);

        // Check invariant after second expense
        int256 sum2 = group.getBalance(alice) +
            group.getBalance(bob) +
            group.getBalance(charlie);
        assertEq(sum2, 0, "Invariant violated after expense 2");

        // Expense 3: Charlie pays everyone
        address[] memory participants3 = new address[](3);
        participants3[0] = alice;
        participants3[1] = bob;
        participants3[2] = charlie;

        uint256[] memory shares3 = new uint256[](3);
        shares3[0] = 50e6;
        shares3[1] = 50e6;
        shares3[2] = 50e6;

        vm.prank(charlie);
        uint256 expense3 = group.createExpense(
            150e6,
            participants3,
            shares3,
            "QmTest3"
        );

        vm.prank(alice);
        group.acceptExpense(expense3);

        vm.prank(bob);
        group.acceptExpense(expense3);

        vm.prank(charlie);
        group.settleExpense(expense3);

        // Check invariant after third expense
        int256 sum3 = group.getBalance(alice) +
            group.getBalance(bob) +
            group.getBalance(charlie);
        assertEq(sum3, 0, "Invariant violated after expense 3");
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_getGroupInfo() public view {
        (
            string memory _name,
            address _token,
            uint256 _memberCount,
            uint256 _expenseCount
        ) = group.getGroupInfo();

        assertEq(_name, "Test Group");
        assertEq(_token, address(token));
        assertEq(_memberCount, 3);
        assertEq(_expenseCount, 0);
    }

    function test_getBalance_InitiallyZero() public view {
        assertEq(group.getBalance(alice), 0);
        assertEq(group.getBalance(bob), 0);
        assertEq(group.getBalance(charlie), 0);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Creates a standard test expense: Alice pays 300, Bob and Charlie each owe 150
    function _createTestExpense() internal returns (uint256 expenseId) {
        address[] memory participants = new address[](2);
        participants[0] = bob;
        participants[1] = charlie;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 150e6;
        shares[1] = 150e6;

        vm.prank(alice);
        expenseId = group.createExpense(
            EXPENSE_AMOUNT,
            participants,
            shares,
            "QmTestExpenseReceipt"
        );
    }
}
