// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GroupEscrow} from "./core/GroupEscrow.sol";
import {GroupDirect} from "./core/GroupDirect.sol";

/**
 * @title ChainSplitFactory
 * @notice Factory contract for deploying and tracking ChainSplit groups.
 * @dev Entry point for creating new groups. Maintains registry for UI queries.
 *      Supports both Direct and Escrow settlement modes.
 */
contract ChainSplitFactory {
    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    /// @notice Settlement mode for a group
    enum GroupMode {
        Direct, // Pull-based settlement, no deposits
        Escrow // Pre-funded deposits, balance updates
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Array of all created group addresses
    address[] public allGroups;

    /// @notice Mapping from user address to their group addresses
    mapping(address => address[]) public userGroups;

    /// @notice Mapping from group address to its mode
    mapping(address => GroupMode) public groupModes;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event DirectGroupCreated(
        address indexed group,
        address indexed creator,
        string name,
        address token,
        uint256 memberCount
    );

    event EscrowGroupCreated(
        address indexed group,
        address indexed creator,
        string name,
        address token,
        uint256 memberCount,
        uint256 requiredDeposit,
        uint256 depositDeadline
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ChainSplitFactory__EmptyName();
    error ChainSplitFactory__InvalidToken();
    error ChainSplitFactory__InvalidMemberCount();
    error ChainSplitFactory__ZeroDeposit();
    error ChainSplitFactory__InvalidDeadline();

    /*//////////////////////////////////////////////////////////////
                          FACTORY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new direct-mode group.
     * @param _name Human-readable group name
     * @param _token ERC20 token address for settlements
     * @param _members Array of member addresses
     * @return group Address of the newly created GroupDirect contract
     * @dev Direct mode has no deposits - settlements pull via transferFrom.
     */
    function createDirectGroup(
        string calldata _name,
        address _token,
        address[] calldata _members
    ) external returns (address group) {
        // Input validation
        if (bytes(_name).length == 0) revert ChainSplitFactory__EmptyName();
        if (_token == address(0)) revert ChainSplitFactory__InvalidToken();
        if (_members.length < 2 || _members.length > 20)
            revert ChainSplitFactory__InvalidMemberCount();

        // Deploy new GroupDirect contract
        GroupDirect directGroup = new GroupDirect(
            _name,
            _token,
            _members,
            msg.sender
        );

        group = address(directGroup);

        // Register group
        allGroups.push(group);
        groupModes[group] = GroupMode.Direct;

        // Register group for each member
        for (uint256 i = 0; i < _members.length; ) {
            userGroups[_members[i]].push(group);
            unchecked {
                ++i;
            }
        }

        emit DirectGroupCreated(
            group,
            msg.sender,
            _name,
            _token,
            _members.length
        );
    }

    /**
     * @notice Create a new escrow-mode group.
     * @param _name Human-readable group name
     * @param _token ERC20 token address for deposits and settlements
     * @param _members Array of member addresses (must include caller)
     * @param _requiredDeposit Amount each member must deposit
     * @param _depositDeadline Unix timestamp - group cancels if not all deposited by then
     * @return group Address of the newly created GroupEscrow contract
     * @dev Validates inputs before deployment.
     *      Caller should be included in members array.
     *      Default deadline: 48 hours from now if not specified.
     */
    function createEscrowGroup(
        string calldata _name,
        address _token,
        address[] calldata _members,
        uint256 _requiredDeposit,
        uint256 _depositDeadline
    ) external returns (address group) {
        // Input validation
        if (bytes(_name).length == 0) revert ChainSplitFactory__EmptyName();
        if (_token == address(0)) revert ChainSplitFactory__InvalidToken();
        if (_members.length < 2 || _members.length > 20)
            revert ChainSplitFactory__InvalidMemberCount();
        if (_requiredDeposit == 0) revert ChainSplitFactory__ZeroDeposit();
        if (_depositDeadline <= block.timestamp)
            revert ChainSplitFactory__InvalidDeadline();

        // Deploy new GroupEscrow contract
        GroupEscrow escrowGroup = new GroupEscrow(
            _name,
            _token,
            _members,
            _requiredDeposit,
            _depositDeadline,
            msg.sender
        );

        group = address(escrowGroup);

        // Register group
        allGroups.push(group);
        groupModes[group] = GroupMode.Escrow;

        // Register group for each member
        for (uint256 i = 0; i < _members.length; ) {
            userGroups[_members[i]].push(group);
            unchecked {
                ++i;
            }
        }

        emit EscrowGroupCreated(
            group,
            msg.sender,
            _name,
            _token,
            _members.length,
            _requiredDeposit,
            _depositDeadline
        );
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the mode of a group.
     * @param group The group address
     * @return The group's settlement mode (Direct or Escrow)
     */
    function getGroupMode(address group) external view returns (GroupMode) {
        return groupModes[group];
    }

    /**
     * @notice Get all groups a user is a member of.
     * @param user The user address
     * @return Array of group addresses
     */
    function getGroupsByUser(
        address user
    ) external view returns (address[] memory) {
        return userGroups[user];
    }

    /**
     * @notice Get total number of groups created.
     * @return Total group count
     */
    function getGroupCount() external view returns (uint256) {
        return allGroups.length;
    }

    /**
     * @notice Get all group addresses.
     * @return Array of all group addresses
     * @dev Use with caution for large deployments - may run out of gas.
     */
    function getAllGroups() external view returns (address[] memory) {
        return allGroups;
    }

    /**
     * @notice Get a paginated list of groups.
     * @param offset Starting index
     * @param limit Maximum number of groups to return
     * @return groups Array of group addresses
     */
    function getGroupsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory groups) {
        uint256 total = allGroups.length;

        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        groups = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; ) {
            groups[i] = allGroups[offset + i];
            unchecked {
                ++i;
            }
        }
    }
}
