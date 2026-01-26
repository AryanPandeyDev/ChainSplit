// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ChainSplitFactory} from "../../src/ChainSplitFactory.sol";
import {GroupEscrow} from "../../src/core/GroupEscrow.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/**
 * @title EscrowFlowTest
 * @notice Integration test for complete escrow mode user journey.
 * @dev Tests the full lifecycle: create group → deposit → expenses → close → withdraw
 */
contract EscrowFlowTest is Test {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    ChainSplitFactory public factory;
    MockERC20 public usdc;

    address public alice;
    address public bob;
    address public charlie;

    uint256 public constant DEPOSIT_AMOUNT = 500e6; // 500 USDC each
    uint256 public constant DEADLINE_DURATION = 48 hours;

    /*//////////////////////////////////////////////////////////////
                              SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        // Create test accounts
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");

        // Deploy factory
        factory = new ChainSplitFactory();

        // Deploy mock USDC
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Fund all members
        usdc.mint(alice, 1000e6);
        usdc.mint(bob, 1000e6);
        usdc.mint(charlie, 1000e6);
    }

    /*//////////////////////////////////////////////////////////////
                    FULL INTEGRATION TEST
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Tests complete escrow flow: Goa Trip scenario
     * @dev Simulates a real-world group expense splitting scenario
     *
     * Scenario:
     * - Alice, Bob, Charlie go on a Goa trip
     * - Each deposits 500 USDC into the group
     * - Alice pays 300 USDC for dinner (split 3 ways)
     * - Bob pays 150 USDC for taxi (split 2 ways: Bob + Charlie)
     * - They close the group and withdraw final balances
     */
    function test_fullEscrowFlow_GoaTrip() public {
        // ============================================================
        // STEP 1: Create Group via Factory
        // ============================================================
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        uint256 deadline = block.timestamp + DEADLINE_DURATION;

        vm.prank(alice);
        address groupAddr = factory.createEscrowGroup(
            "Goa Trip 2026",
            address(usdc),
            members,
            DEPOSIT_AMOUNT,
            deadline
        );

        GroupEscrow group = GroupEscrow(groupAddr);

        // Verify group created
        assertEq(factory.getGroupCount(), 1);
        assertEq(factory.getGroupsByUser(alice).length, 1);
        assertEq(
            uint256(group.state()),
            uint256(GroupEscrow.GroupState.Pending)
        );

        console.log("Step 1: Group created at", groupAddr);

        // ============================================================
        // STEP 2: All Members Deposit
        // ============================================================

        // Approve and deposit for all members
        vm.prank(alice);
        usdc.approve(groupAddr, DEPOSIT_AMOUNT);
        vm.prank(alice);
        group.deposit();

        vm.prank(bob);
        usdc.approve(groupAddr, DEPOSIT_AMOUNT);
        vm.prank(bob);
        group.deposit();

        vm.prank(charlie);
        usdc.approve(groupAddr, DEPOSIT_AMOUNT);
        vm.prank(charlie);
        group.deposit();

        // Verify group is now active
        assertEq(
            uint256(group.state()),
            uint256(GroupEscrow.GroupState.Active)
        );
        assertEq(group.balances(alice), DEPOSIT_AMOUNT);
        assertEq(group.balances(bob), DEPOSIT_AMOUNT);
        assertEq(group.balances(charlie), DEPOSIT_AMOUNT);

        console.log("Step 2: All members deposited. Group is ACTIVE.");

        // ============================================================
        // STEP 3: Create Expense #1 - Alice pays for dinner (300 USDC)
        // ============================================================
        address[] memory dinnerParticipants = new address[](3);
        dinnerParticipants[0] = alice;
        dinnerParticipants[1] = bob;
        dinnerParticipants[2] = charlie;

        uint256[] memory dinnerShares = new uint256[](3);
        dinnerShares[0] = 100e6; // Alice: 100 USDC
        dinnerShares[1] = 100e6; // Bob: 100 USDC
        dinnerShares[2] = 100e6; // Charlie: 100 USDC

        vm.prank(alice);
        uint256 dinnerExpenseId = group.createExpense(
            300e6,
            dinnerParticipants,
            dinnerShares,
            "QmDinnerReceipt"
        );

        console.log(
            "Step 3: Expense #1 (Dinner) created. ID:",
            dinnerExpenseId
        );

        // ============================================================
        // STEP 4: Bob and Charlie accept dinner expense
        // ============================================================
        vm.prank(bob);
        group.acceptExpense(dinnerExpenseId);

        vm.prank(charlie);
        group.acceptExpense(dinnerExpenseId);

        // Verify expense is settled
        (, , , GroupEscrow.ExpenseState dinnerState, ) = group.getExpense(
            dinnerExpenseId
        );
        assertEq(
            uint256(dinnerState),
            uint256(GroupEscrow.ExpenseState.Settled)
        );

        // Verify balances after dinner:
        // Alice: 500 + 200 (reimbursed by Bob+Charlie) = 700
        // Bob: 500 - 100 = 400
        // Charlie: 500 - 100 = 400
        assertEq(group.balances(alice), 700e6);
        assertEq(group.balances(bob), 400e6);
        assertEq(group.balances(charlie), 400e6);

        console.log("Step 4: Dinner expense settled.");
        console.log("  Alice:", group.balances(alice) / 1e6, "USDC");
        console.log("  Bob:", group.balances(bob) / 1e6, "USDC");
        console.log("  Charlie:", group.balances(charlie) / 1e6, "USDC");

        // ============================================================
        // STEP 5: Create Expense #2 - Bob pays for taxi (150 USDC)
        // ============================================================
        address[] memory taxiParticipants = new address[](2);
        taxiParticipants[0] = bob;
        taxiParticipants[1] = charlie;

        uint256[] memory taxiShares = new uint256[](2);
        taxiShares[0] = 75e6; // Bob: 75 USDC
        taxiShares[1] = 75e6; // Charlie: 75 USDC

        vm.prank(bob);
        uint256 taxiExpenseId = group.createExpense(
            150e6,
            taxiParticipants,
            taxiShares,
            "QmTaxiReceipt"
        );

        console.log("Step 5: Expense #2 (Taxi) created. ID:", taxiExpenseId);

        // ============================================================
        // STEP 6: Charlie accepts taxi expense
        // ============================================================
        vm.prank(charlie);
        group.acceptExpense(taxiExpenseId);

        // Verify expense is settled
        (, , , GroupEscrow.ExpenseState taxiState, ) = group.getExpense(
            taxiExpenseId
        );
        assertEq(uint256(taxiState), uint256(GroupEscrow.ExpenseState.Settled));

        // Verify balances after taxi:
        // Alice: 700 (unchanged, not in taxi)
        // Bob: 400 + 75 (reimbursed by Charlie) = 475
        // Charlie: 400 - 75 = 325
        assertEq(group.balances(alice), 700e6);
        assertEq(group.balances(bob), 475e6);
        assertEq(group.balances(charlie), 325e6);

        console.log("Step 6: Taxi expense settled.");
        console.log("  Alice:", group.balances(alice) / 1e6, "USDC");
        console.log("  Bob:", group.balances(bob) / 1e6, "USDC");
        console.log("  Charlie:", group.balances(charlie) / 1e6, "USDC");

        // ============================================================
        // STEP 7: Close the group (unanimous vote)
        // ============================================================
        vm.prank(alice);
        group.proposeClose();

        vm.prank(bob);
        group.voteClose();

        vm.prank(charlie);
        group.voteClose();

        // Verify group is closed
        assertEq(
            uint256(group.state()),
            uint256(GroupEscrow.GroupState.Closed)
        );

        console.log("Step 7: Group closed unanimously.");

        // ============================================================
        // STEP 8: Everyone withdraws their final balance
        // ============================================================
        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        uint256 bobBalanceBefore = usdc.balanceOf(bob);
        uint256 charlieBalanceBefore = usdc.balanceOf(charlie);

        vm.prank(alice);
        group.withdraw();

        vm.prank(bob);
        group.withdraw();

        vm.prank(charlie);
        group.withdraw();

        // Verify final token balances
        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + 700e6);
        assertEq(usdc.balanceOf(bob), bobBalanceBefore + 475e6);
        assertEq(usdc.balanceOf(charlie), charlieBalanceBefore + 325e6);

        // Verify group balances are zero
        assertEq(group.balances(alice), 0);
        assertEq(group.balances(bob), 0);
        assertEq(group.balances(charlie), 0);

        // Verify contract has no remaining tokens
        assertEq(usdc.balanceOf(groupAddr), 0);

        console.log("Step 8: All withdrawals complete.");
        console.log(
            "  Alice final wallet:",
            usdc.balanceOf(alice) / 1e6,
            "USDC"
        );
        console.log("  Bob final wallet:", usdc.balanceOf(bob) / 1e6, "USDC");
        console.log(
            "  Charlie final wallet:",
            usdc.balanceOf(charlie) / 1e6,
            "USDC"
        );

        // ============================================================
        // FINAL VERIFICATION: Balance Invariant
        // ============================================================
        // Total deposited: 500 * 3 = 1500 USDC
        // Total withdrawn: 700 + 475 + 325 = 1500 USDC
        // Nothing lost, nothing gained. Perfect conservation.
        uint256 totalWithdrawn = (usdc.balanceOf(alice) -
            (1000e6 - DEPOSIT_AMOUNT)) +
            (usdc.balanceOf(bob) - (1000e6 - DEPOSIT_AMOUNT)) +
            (usdc.balanceOf(charlie) - (1000e6 - DEPOSIT_AMOUNT));
        assertEq(
            totalWithdrawn,
            DEPOSIT_AMOUNT * 3,
            "Balance invariant: total withdrawn must equal total deposited"
        );

        console.log("========================================");
        console.log("INTEGRATION TEST PASSED: Goa Trip Complete!");
        console.log("========================================");
    }

    /**
     * @notice Tests group cancellation and refund flow
     */
    function test_cancellationFlow_RefundsDepositors() public {
        // Create group
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        uint256 deadline = block.timestamp + DEADLINE_DURATION;

        vm.prank(alice);
        address groupAddr = factory.createEscrowGroup(
            "Cancelled Trip",
            address(usdc),
            members,
            DEPOSIT_AMOUNT,
            deadline
        );

        GroupEscrow group = GroupEscrow(groupAddr);

        // Only Alice and Bob deposit
        vm.prank(alice);
        usdc.approve(groupAddr, DEPOSIT_AMOUNT);
        vm.prank(alice);
        group.deposit();

        vm.prank(bob);
        usdc.approve(groupAddr, DEPOSIT_AMOUNT);
        vm.prank(bob);
        group.deposit();

        // Charlie decides not to join - warp past deadline
        vm.warp(block.timestamp + DEADLINE_DURATION + 1);

        // Anyone can trigger the deadline check
        group.checkDeadline();

        // Verify cancelled
        assertEq(
            uint256(group.state()),
            uint256(GroupEscrow.GroupState.Cancelled)
        );

        // Get balances before refund
        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 bobBefore = usdc.balanceOf(bob);

        // Claim refunds
        vm.prank(alice);
        group.refundDeposit();

        vm.prank(bob);
        group.refundDeposit();

        // Verify refunds
        assertEq(usdc.balanceOf(alice), aliceBefore + DEPOSIT_AMOUNT);
        assertEq(usdc.balanceOf(bob), bobBefore + DEPOSIT_AMOUNT);

        console.log("Cancellation flow test passed: All depositors refunded");
    }
}
