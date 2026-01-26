// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ChainSplitFactory} from "../../src/ChainSplitFactory.sol";
import {GroupDirect} from "../../src/core/GroupDirect.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/**
 * @title DirectFlowTest
 * @notice Integration test for complete Direct mode flow
 * @dev Simulates real-world scenarios:
 *      1. Restaurant bill splitting
 *      2. Expense cancellation
 *      3. Multiple expenses with balance netting
 */
contract DirectFlowTest is Test {
    ChainSplitFactory public factory;
    MockERC20 public usdc;

    address public alice;
    address public bob;
    address public charlie;

    uint256 public constant INITIAL_BALANCE = 5_000e6; // 5,000 USDC

    function setUp() public {
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");

        factory = new ChainSplitFactory();
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Fund all participants
        usdc.mint(alice, INITIAL_BALANCE);
        usdc.mint(bob, INITIAL_BALANCE);
        usdc.mint(charlie, INITIAL_BALANCE);
    }

    /**
     * @notice Full Direct mode flow: Create group → Expenses → Settlement → Withdrawal
     *
     * Scenario: Friends splitting dinner bills over multiple outings
     * - Dinner 1: Alice pays $90 (split 3 ways: $30 each)
     * - Dinner 2: Bob pays $60 (split between Bob and Charlie: $30 each)
     *
     * Expected final state:
     * - Alice: +$60 (credited for Bob+Charlie's shares)
     * - Bob: $0 (paid $30 to Alice, received $30 from Charlie)
     * - Charlie: -$60 (paid $30 to Alice, $30 to Bob)
     */
    function test_fullDirectFlow_RestaurantBills() public {
        // ========================================
        // PHASE 1: Group Creation via Factory
        // ========================================
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        vm.prank(alice);
        address groupAddr = factory.createDirectGroup(
            "Restaurant Friends",
            address(usdc),
            members
        );

        GroupDirect group = GroupDirect(groupAddr);

        // Verify factory registered the group correctly
        assertEq(factory.getGroupCount(), 1);
        assertEq(
            uint256(factory.getGroupMode(groupAddr)),
            uint256(ChainSplitFactory.GroupMode.Direct)
        );

        address[] memory aliceGroups = factory.getGroupsByUser(alice);
        assertEq(aliceGroups.length, 1);
        assertEq(aliceGroups[0], groupAddr);

        // ========================================
        // PHASE 2: Token Approvals
        // ========================================
        vm.prank(alice);
        usdc.approve(groupAddr, type(uint256).max);

        vm.prank(bob);
        usdc.approve(groupAddr, type(uint256).max);

        vm.prank(charlie);
        usdc.approve(groupAddr, type(uint256).max);

        // ========================================
        // PHASE 3: Expense 1 - Alice pays $90
        // ========================================
        address[] memory dinner1Participants = new address[](3);
        dinner1Participants[0] = alice;
        dinner1Participants[1] = bob;
        dinner1Participants[2] = charlie;

        uint256[] memory dinner1Shares = new uint256[](3);
        dinner1Shares[0] = 30e6; // Alice
        dinner1Shares[1] = 30e6; // Bob
        dinner1Shares[2] = 30e6; // Charlie

        vm.prank(alice);
        uint256 expense1 = group.createExpense(
            90e6,
            dinner1Participants,
            dinner1Shares,
            "QmDinner1Receipt"
        );

        // Verify expense created
        (
            address payer,
            uint256 amount,
            ,
            GroupDirect.ExpenseState state,

        ) = group.getExpense(expense1);
        assertEq(payer, alice);
        assertEq(amount, 90e6);
        assertEq(uint256(state), uint256(GroupDirect.ExpenseState.Created));

        // Bob and Charlie accept
        vm.prank(bob);
        group.acceptExpense(expense1);

        vm.prank(charlie);
        group.acceptExpense(expense1);

        // Alice settles
        vm.prank(alice);
        group.settleExpense(expense1);

        // Verify state after expense 1
        assertEq(group.getBalance(alice), 60e6); // +60 (Bob+Charlie shares)
        assertEq(group.getBalance(bob), -30e6); // -30
        assertEq(group.getBalance(charlie), -30e6); // -30

        // Verify tokens transferred
        assertEq(usdc.balanceOf(bob), INITIAL_BALANCE - 30e6);
        assertEq(usdc.balanceOf(charlie), INITIAL_BALANCE - 30e6);

        // ========================================
        // PHASE 4: Expense 2 - Bob pays $60
        // ========================================
        address[] memory dinner2Participants = new address[](2);
        dinner2Participants[0] = bob;
        dinner2Participants[1] = charlie;

        uint256[] memory dinner2Shares = new uint256[](2);
        dinner2Shares[0] = 30e6; // Bob
        dinner2Shares[1] = 30e6; // Charlie

        vm.prank(bob);
        uint256 expense2 = group.createExpense(
            60e6,
            dinner2Participants,
            dinner2Shares,
            "QmDinner2Receipt"
        );

        // Charlie accepts
        vm.prank(charlie);
        group.acceptExpense(expense2);

        // Bob settles
        vm.prank(bob);
        group.settleExpense(expense2);

        // Verify final balances
        assertEq(group.getBalance(alice), 60e6); // Unchanged
        assertEq(group.getBalance(bob), 0); // -30 + 30 = 0
        assertEq(group.getBalance(charlie), -60e6); // -30 - 30 = -60

        // ========================================
        // PHASE 5: Verify Zero-Sum Invariant
        // ========================================
        int256 sum = group.getBalance(alice) +
            group.getBalance(bob) +
            group.getBalance(charlie);
        assertEq(sum, 0, "INVARIANT VIOLATED: Balance sum must be 0");

        // ========================================
        // PHASE 6: Withdrawals
        // ========================================
        uint256 aliceTokensBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        group.withdraw();

        assertEq(usdc.balanceOf(alice), aliceTokensBefore + 60e6);
        assertEq(group.getWithdrawableBalance(alice), 0);

        // Bob withdraws his $30 from expense 2
        uint256 bobTokensBefore = usdc.balanceOf(bob);

        vm.prank(bob);
        group.withdraw();

        assertEq(usdc.balanceOf(bob), bobTokensBefore + 30e6);
        assertEq(group.getWithdrawableBalance(bob), 0);
    }

    /**
     * @notice Test expense cancellation flow
     * Scenario: Expense is created, accepted, but then cancelled before settlement
     */
    function test_cancellationFlow() public {
        // Create group
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        vm.prank(alice);
        address groupAddr = factory.createDirectGroup(
            "Cancel Test Group",
            address(usdc),
            members
        );

        GroupDirect group = GroupDirect(groupAddr);

        // Approve tokens
        vm.prank(bob);
        usdc.approve(groupAddr, type(uint256).max);

        // Create expense
        address[] memory participants = new address[](1);
        participants[0] = bob;

        uint256[] memory shares = new uint256[](1);
        shares[0] = 100e6;

        vm.prank(alice);
        uint256 expenseId = group.createExpense(
            100e6,
            participants,
            shares,
            "QmTestReceipt"
        );

        // Bob accepts
        vm.prank(bob);
        group.acceptExpense(expenseId);

        // Alice cancels before settlement - this is allowed
        vm.prank(alice);
        group.cancelExpense(expenseId);

        // Verify state
        (, , , GroupDirect.ExpenseState state, ) = group.getExpense(expenseId);
        assertEq(uint256(state), uint256(GroupDirect.ExpenseState.Cancelled));

        // Verify NO token transfers occurred
        assertEq(usdc.balanceOf(bob), INITIAL_BALANCE);
        assertEq(usdc.balanceOf(address(group)), 0);

        // Verify balances unchanged
        assertEq(group.getBalance(alice), 0);
        assertEq(group.getBalance(bob), 0);
    }

    /**
     * @notice Test that settlement fails if participant hasn't approved tokens
     */
    function test_settlementFailsWithoutApproval() public {
        // Create group
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        vm.prank(alice);
        address groupAddr = factory.createDirectGroup(
            "Approval Test",
            address(usdc),
            members
        );

        GroupDirect group = GroupDirect(groupAddr);

        // Bob does NOT approve tokens

        // Create expense
        address[] memory participants = new address[](1);
        participants[0] = bob;

        uint256[] memory shares = new uint256[](1);
        shares[0] = 100e6;

        vm.prank(alice);
        uint256 expenseId = group.createExpense(
            100e6,
            participants,
            shares,
            "QmTest"
        );

        // Bob accepts
        vm.prank(bob);
        group.acceptExpense(expenseId);

        // Settlement should fail because Bob hasn't approved
        vm.prank(alice);
        vm.expectRevert(); // SafeERC20 will revert
        group.settleExpense(expenseId);
    }

    /**
     * @notice Test creating multiple groups via factory
     */
    function test_multipleGroupCreation() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        vm.prank(alice);
        address group1 = factory.createDirectGroup(
            "Group 1",
            address(usdc),
            members
        );

        vm.prank(bob);
        address group2 = factory.createDirectGroup(
            "Group 2",
            address(usdc),
            members
        );

        assertEq(factory.getGroupCount(), 2);
        assertTrue(group1 != address(0));
        assertTrue(group2 != address(0));
        assertTrue(group1 != group2);

        address[] memory aliceGroups = factory.getGroupsByUser(alice);
        assertEq(aliceGroups.length, 2);

        address[] memory bobGroups = factory.getGroupsByUser(bob);
        assertEq(bobGroups.length, 2);
    }
}
