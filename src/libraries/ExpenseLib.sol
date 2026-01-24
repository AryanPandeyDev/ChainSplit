// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ExpenseLib
 * @notice Pure library for expense share calculations and validation.
 * @dev All functions are pure - no state, no external calls.
 *
 * Settlement Rules Reference (from docs/SETTLEMENT_RULES.md):
 * - Rule 1: payerReimbursement = totalAmount - payerShare (if payer is participant)
 * - Rule 2: share = totalAmount / numberOfParticipants, remainder goes to payer
 * - Rule 3: For custom split, sum(shares) MUST equal totalAmount
 */
library ExpenseLib {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when participants array is empty
    error NoParticipants();

    /// @notice Thrown when shares array length doesn't match participants length
    error SharesLengthMismatch();

    /// @notice Thrown when sum of shares doesn't equal total amount
    error SharesSumMismatch(uint256 expected, uint256 actual);

    /// @notice Thrown when a share amount is zero
    error ZeroShare();

    /// @notice Thrown when total amount is zero
    error ZeroAmount();

    /*//////////////////////////////////////////////////////////////
                            VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validates that shares array matches participants and sums to total.
     * @param amount Total expense amount
     * @param shares Array of share amounts per participant
     * @dev Reverts if:
     *      - amount is zero
     *      - shares array is empty
     *      - any share is zero
     *      - sum(shares) != amount
     */
    function validateShares(
        uint256 amount,
        uint256[] calldata shares
    ) internal pure {
        if (amount == 0) revert ZeroAmount();
        if (shares.length == 0) revert NoParticipants();

        uint256 sum = 0;
        for (uint256 i = 0; i < shares.length; ) {
            if (shares[i] == 0) revert ZeroShare();
            sum += shares[i];
            unchecked {
                ++i;
            }
        }

        if (sum != amount) revert SharesSumMismatch(amount, sum);
    }

    /**
     * @notice Validates that participants and shares arrays have matching lengths.
     * @param participantsLength Length of participants array
     * @param sharesLength Length of shares array
     */
    function validateArrayLengths(
        uint256 participantsLength,
        uint256 sharesLength
    ) internal pure {
        if (participantsLength == 0) revert NoParticipants();
        if (participantsLength != sharesLength) revert SharesLengthMismatch();
    }

    /*//////////////////////////////////////////////////////////////
                            CALCULATIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculates equal shares for a given amount and participant count.
     * @param amount Total expense amount
     * @param participantCount Number of participants
     * @return shares Array of share amounts (remainder added to first share)
     * @dev Remainder handling: The remainder goes to index 0 (typically the payer).
     *      This ensures no funds are lost and payer is slightly favored.
     *      Example: 100 / 3 = [34, 33, 33] (remainder of 1 goes to index 0)
     */
    function calculateEqualShares(
        uint256 amount,
        uint256 participantCount
    ) internal pure returns (uint256[] memory shares) {
        if (amount == 0) revert ZeroAmount();
        if (participantCount == 0) revert NoParticipants();

        shares = new uint256[](participantCount);
        uint256 baseShare = amount / participantCount;
        uint256 remainder = amount % participantCount;

        for (uint256 i = 0; i < participantCount; ) {
            shares[i] = baseShare;
            unchecked {
                ++i;
            }
        }

        // Add remainder to first share (payer position)
        if (remainder > 0) {
            shares[0] += remainder;
        }
    }

    /**
     * @notice Calculates the payer's total reimbursement amount.
     * @param shares Array of all share amounts
     * @param payerIndex Index of the payer in the participants array
     * @return reimbursement Sum of all shares except the payer's share
     * @dev The payer is reimbursed for other people's shares only.
     *      If payerIndex is out of bounds (payer not a participant),
     *      returns sum of all shares.
     */
    function calculatePayerReimbursement(
        uint256[] calldata shares,
        uint256 payerIndex
    ) internal pure returns (uint256 reimbursement) {
        for (uint256 i = 0; i < shares.length; ) {
            if (i != payerIndex) {
                reimbursement += shares[i];
            }
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Counts how many acceptances are required for an expense.
     * @param participantCount Total number of participants
     * @param payerIsParticipant Whether the payer is one of the participants
     * @return count Number of acceptances required
     * @dev Payer doesn't need to accept their own expense.
     *      If payer is a participant: count = participantCount - 1
     *      If payer is not a participant: count = participantCount
     */
    function requiredAcceptanceCount(
        uint256 participantCount,
        bool payerIsParticipant
    ) internal pure returns (uint256 count) {
        if (payerIsParticipant) {
            // Payer doesn't accept their own expense
            return participantCount > 0 ? participantCount - 1 : 0;
        }
        return participantCount;
    }
}
