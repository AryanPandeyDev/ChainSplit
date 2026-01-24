// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ExpenseLib} from "../../src/libraries/ExpenseLib.sol";

/**
 * @title ExpenseLibWrapper
 * @notice Wrapper contract to test ExpenseLib functions that require calldata.
 * @dev Library functions with calldata params can't be called directly from tests.
 */
contract ExpenseLibWrapper {
    function validateShares(
        uint256 amount,
        uint256[] calldata shares
    ) external pure {
        ExpenseLib.validateShares(amount, shares);
    }

    function validateArrayLengths(
        uint256 participantsLength,
        uint256 sharesLength
    ) external pure {
        ExpenseLib.validateArrayLengths(participantsLength, sharesLength);
    }

    function calculateEqualShares(
        uint256 amount,
        uint256 participantCount
    ) external pure returns (uint256[] memory) {
        return ExpenseLib.calculateEqualShares(amount, participantCount);
    }

    function calculatePayerReimbursement(
        uint256[] calldata shares,
        uint256 payerIndex
    ) external pure returns (uint256) {
        return ExpenseLib.calculatePayerReimbursement(shares, payerIndex);
    }

    function requiredAcceptanceCount(
        uint256 participantCount,
        bool payerIsParticipant
    ) external pure returns (uint256) {
        return
            ExpenseLib.requiredAcceptanceCount(
                participantCount,
                payerIsParticipant
            );
    }
}

/**
 * @title ExpenseLibTest
 * @notice Unit tests for ExpenseLib library functions.
 */
contract ExpenseLibTest is Test {
    ExpenseLibWrapper public wrapper;

    function setUp() public {
        wrapper = new ExpenseLibWrapper();
    }

    /*//////////////////////////////////////////////////////////////
                        VALIDATE SHARES TESTS
    //////////////////////////////////////////////////////////////*/

    function test_validateShares_ValidEqual() public view {
        uint256[] memory shares = new uint256[](3);
        shares[0] = 34;
        shares[1] = 33;
        shares[2] = 33;

        // Should not revert
        wrapper.validateShares(100, shares);
    }

    function test_validateShares_RevertsOnZeroAmount() public {
        uint256[] memory shares = new uint256[](2);
        shares[0] = 50;
        shares[1] = 50;

        vm.expectRevert(ExpenseLib.ZeroAmount.selector);
        wrapper.validateShares(0, shares);
    }

    function test_validateShares_RevertsOnEmptyShares() public {
        uint256[] memory shares = new uint256[](0);

        vm.expectRevert(ExpenseLib.NoParticipants.selector);
        wrapper.validateShares(100, shares);
    }

    function test_validateShares_RevertsOnZeroShare() public {
        uint256[] memory shares = new uint256[](3);
        shares[0] = 50;
        shares[1] = 0; // Zero share
        shares[2] = 50;

        vm.expectRevert(ExpenseLib.ZeroShare.selector);
        wrapper.validateShares(100, shares);
    }

    function test_validateShares_RevertsOnSumMismatch() public {
        uint256[] memory shares = new uint256[](2);
        shares[0] = 40;
        shares[1] = 50; // Sum = 90, not 100

        vm.expectRevert(
            abi.encodeWithSelector(
                ExpenseLib.SharesSumMismatch.selector,
                100,
                90
            )
        );
        wrapper.validateShares(100, shares);
    }

    /*//////////////////////////////////////////////////////////////
                    VALIDATE ARRAY LENGTHS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_validateArrayLengths_Valid() public view {
        // Should not revert
        wrapper.validateArrayLengths(3, 3);
    }

    function test_validateArrayLengths_RevertsOnZeroParticipants() public {
        vm.expectRevert(ExpenseLib.NoParticipants.selector);
        wrapper.validateArrayLengths(0, 0);
    }

    function test_validateArrayLengths_RevertsOnMismatch() public {
        vm.expectRevert(ExpenseLib.SharesLengthMismatch.selector);
        wrapper.validateArrayLengths(3, 2);
    }

    /*//////////////////////////////////////////////////////////////
                    CALCULATE EQUAL SHARES TESTS
    //////////////////////////////////////////////////////////////*/

    function test_calculateEqualShares_EvenSplit() public view {
        uint256[] memory shares = wrapper.calculateEqualShares(100, 4);

        assertEq(shares.length, 4);
        assertEq(shares[0], 25);
        assertEq(shares[1], 25);
        assertEq(shares[2], 25);
        assertEq(shares[3], 25);

        // Sum check
        uint256 sum = shares[0] + shares[1] + shares[2] + shares[3];
        assertEq(sum, 100);
    }

    function test_calculateEqualShares_RemainderGoesToFirst() public view {
        uint256[] memory shares = wrapper.calculateEqualShares(100, 3);

        assertEq(shares.length, 3);
        assertEq(shares[0], 34); // Gets remainder
        assertEq(shares[1], 33);
        assertEq(shares[2], 33);

        // Sum check
        uint256 sum = shares[0] + shares[1] + shares[2];
        assertEq(sum, 100);
    }

    function test_calculateEqualShares_SingleParticipant() public view {
        uint256[] memory shares = wrapper.calculateEqualShares(100, 1);

        assertEq(shares.length, 1);
        assertEq(shares[0], 100);
    }

    function test_calculateEqualShares_LargeRemainder() public view {
        uint256[] memory shares = wrapper.calculateEqualShares(10, 7);

        assertEq(shares.length, 7);
        // 10 / 7 = 1, remainder = 3
        assertEq(shares[0], 1 + 3); // First gets remainder
        for (uint256 i = 1; i < 7; i++) {
            assertEq(shares[i], 1);
        }

        // Sum check
        uint256 sum = 0;
        for (uint256 i = 0; i < 7; i++) {
            sum += shares[i];
        }
        assertEq(sum, 10);
    }

    function test_calculateEqualShares_RevertsOnZeroAmount() public {
        vm.expectRevert(ExpenseLib.ZeroAmount.selector);
        wrapper.calculateEqualShares(0, 3);
    }

    function test_calculateEqualShares_RevertsOnZeroParticipants() public {
        vm.expectRevert(ExpenseLib.NoParticipants.selector);
        wrapper.calculateEqualShares(100, 0);
    }

    /*//////////////////////////////////////////////////////////////
                CALCULATE PAYER REIMBURSEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_calculatePayerReimbursement_PayerIsParticipant() public view {
        uint256[] memory shares = new uint256[](3);
        shares[0] = 34; // Payer's share (index 0)
        shares[1] = 33;
        shares[2] = 33;

        // Payer should get reimbursed for shares[1] + shares[2] = 66
        uint256 reimbursement = wrapper.calculatePayerReimbursement(shares, 0);
        assertEq(reimbursement, 66);
    }

    function test_calculatePayerReimbursement_PayerNotParticipant()
        public
        view
    {
        uint256[] memory shares = new uint256[](3);
        shares[0] = 34;
        shares[1] = 33;
        shares[2] = 33;

        // Payer index out of bounds (not a participant)
        // Should get reimbursed for all shares = 100
        uint256 reimbursement = wrapper.calculatePayerReimbursement(
            shares,
            999
        );
        assertEq(reimbursement, 100);
    }

    function test_calculatePayerReimbursement_PayerInMiddle() public view {
        uint256[] memory shares = new uint256[](3);
        shares[0] = 30;
        shares[1] = 40; // Payer's share (index 1)
        shares[2] = 30;

        // Payer should get reimbursed for shares[0] + shares[2] = 60
        uint256 reimbursement = wrapper.calculatePayerReimbursement(shares, 1);
        assertEq(reimbursement, 60);
    }

    /*//////////////////////////////////////////////////////////////
                REQUIRED ACCEPTANCE COUNT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_requiredAcceptanceCount_PayerIsParticipant() public view {
        // 5 participants, payer is one of them
        uint256 count = wrapper.requiredAcceptanceCount(5, true);
        assertEq(count, 4); // 5 - 1 = 4
    }

    function test_requiredAcceptanceCount_PayerNotParticipant() public view {
        // 5 participants, payer is NOT one of them
        uint256 count = wrapper.requiredAcceptanceCount(5, false);
        assertEq(count, 5); // All must accept
    }

    function test_requiredAcceptanceCount_SingleParticipantIsPayer()
        public
        view
    {
        // 1 participant who is also payer
        uint256 count = wrapper.requiredAcceptanceCount(1, true);
        assertEq(count, 0); // No one else needs to accept
    }

    function test_requiredAcceptanceCount_ZeroParticipants() public view {
        uint256 count = wrapper.requiredAcceptanceCount(0, false);
        assertEq(count, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_calculateEqualShares_SumEqualsAmount(
        uint256 amount,
        uint256 participantCount
    ) public view {
        // Bound inputs to reasonable ranges
        amount = bound(amount, 1, 1e18);
        participantCount = bound(participantCount, 1, 20);

        uint256[] memory shares = wrapper.calculateEqualShares(
            amount,
            participantCount
        );

        // Sum of shares must equal amount
        uint256 sum = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            sum += shares[i];
        }

        assertEq(sum, amount, "Sum of shares must equal amount");
        assertEq(
            shares.length,
            participantCount,
            "Shares length must equal participant count"
        );
    }
}
