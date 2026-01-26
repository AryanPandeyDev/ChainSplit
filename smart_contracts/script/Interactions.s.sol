// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DevOpsTools} from "foundry-devops/DevOpsTools.sol";
import {ChainSplitFactory} from "../src/ChainSplitFactory.sol";
import {GroupEscrow} from "../src/core/GroupEscrow.sol";
import {GroupDirect} from "../src/core/GroupDirect.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Interactions
 * @notice Scripts for interacting with deployed ChainSplit contracts.
 * @dev Uses foundry-devops to auto-detect deployed contracts from broadcast folder.
 *
 * Usage:
 *   # Create a group (auto-detects factory and token)
 *   forge script script/Interactions.s.sol:CreateEscrowGroup --rpc-url $RPC_URL --broadcast
 *
 *   # Or specify manually with env vars
 *   FACTORY_ADDRESS=0x... forge script script/Interactions.s.sol:CreateEscrowGroup --rpc-url $RPC_URL --broadcast
 */

interface IMockERC20 {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

/*//////////////////////////////////////////////////////////////
                    MINT MOCK TOKENS (LOCAL ONLY)
//////////////////////////////////////////////////////////////*/

/**
 * @notice Mints mock tokens for testing on local Anvil.
 * @dev Auto-detects MockUSDC from deployment, or uses TOKEN_ADDRESS env var.
 */
contract MintMockTokens is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        // Auto-detect token or use env var
        address tokenAddr = _getTokenAddress();
        uint256 mintAmount = vm.envOr("MINT_AMOUNT", uint256(10_000e6)); // Default 10,000 tokens

        // Anvil default accounts
        address account0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address account1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        address account2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

        console.log("Minting Mock Tokens:");
        console.log("  Token:", tokenAddr);
        console.log("  Amount per account:", mintAmount);

        vm.startBroadcast(deployerKey);

        IMockERC20 token = IMockERC20(tokenAddr);
        token.mint(account0, mintAmount);
        token.mint(account1, mintAmount);
        token.mint(account2, mintAmount);

        vm.stopBroadcast();

        console.log("");
        console.log("Minted to:");
        console.log(
            "  Account 0:",
            account0,
            "Balance:",
            token.balanceOf(account0)
        );
        console.log(
            "  Account 1:",
            account1,
            "Balance:",
            token.balanceOf(account1)
        );
        console.log(
            "  Account 2:",
            account2,
            "Balance:",
            token.balanceOf(account2)
        );
    }

    function _getTokenAddress() internal view returns (address) {
        // Try env var first
        try vm.envAddress("TOKEN_ADDRESS") returns (address addr) {
            return addr;
        } catch {}
        // Auto-detect from deployment
        return
            DevOpsTools.get_most_recent_deployment("MockUSDC", block.chainid);
    }
}

/*//////////////////////////////////////////////////////////////
                    CREATE ESCROW GROUP
//////////////////////////////////////////////////////////////*/

/**
 * @notice Creates a new escrow group via the factory.
 * @dev Auto-detects ChainSplitFactory and MockUSDC from deployment.
 */
contract CreateEscrowGroup is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        // Auto-detect or use env vars
        address factoryAddr = _getFactoryAddress();
        address tokenAddr = _getTokenAddress();

        string memory groupName = vm.envOr("GROUP_NAME", string("My Group"));
        uint256 depositAmount = vm.envOr("DEPOSIT_AMOUNT", uint256(100e6)); // Default 100 USDC
        uint256 deadlineDays = vm.envOr("DEADLINE_DAYS", uint256(2));

        // Parse members
        address[] memory members = _parseMembers();

        console.log("Creating Escrow Group:");
        console.log("  Factory:", factoryAddr);
        console.log("  Token:", tokenAddr);
        console.log("  Name:", groupName);
        console.log("  Deposit:", depositAmount);
        console.log("  Members:", members.length);

        vm.startBroadcast(deployerKey);

        ChainSplitFactory factory = ChainSplitFactory(factoryAddr);
        address groupAddr = factory.createEscrowGroup(
            groupName,
            tokenAddr,
            members,
            depositAmount,
            block.timestamp + (deadlineDays * 1 days)
        );

        vm.stopBroadcast();

        console.log("");
        console.log("Group created at:", groupAddr);
        console.log("");
        console.log(
            "Next: Set GROUP_ADDRESS=",
            groupAddr,
            "and run make deposit"
        );
    }

    function _getFactoryAddress() internal view returns (address) {
        try vm.envAddress("FACTORY_ADDRESS") returns (address addr) {
            return addr;
        } catch {}
        return
            DevOpsTools.get_most_recent_deployment(
                "ChainSplitFactory",
                block.chainid
            );
    }

    function _getTokenAddress() internal view returns (address) {
        try vm.envAddress("TOKEN_ADDRESS") returns (address addr) {
            return addr;
        } catch {}
        return
            DevOpsTools.get_most_recent_deployment("MockUSDC", block.chainid);
    }

    function _parseMembers() internal view returns (address[] memory) {
        address member1 = vm.envOr("MEMBER_1", address(0));
        address member2 = vm.envOr("MEMBER_2", address(0));
        address member3 = vm.envOr("MEMBER_3", address(0));
        address member4 = vm.envOr("MEMBER_4", address(0));
        address member5 = vm.envOr("MEMBER_5", address(0));

        // If no members specified, use first two Anvil accounts
        if (member1 == address(0) && member2 == address(0)) {
            address[] memory defaultMembers = new address[](2);
            defaultMembers[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
            defaultMembers[1] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
            return defaultMembers;
        }

        // Count non-zero members
        uint256 count = 0;
        if (member1 != address(0)) count++;
        if (member2 != address(0)) count++;
        if (member3 != address(0)) count++;
        if (member4 != address(0)) count++;
        if (member5 != address(0)) count++;

        require(count >= 2, "Need at least 2 members");

        address[] memory members = new address[](count);
        uint256 idx = 0;
        if (member1 != address(0)) members[idx++] = member1;
        if (member2 != address(0)) members[idx++] = member2;
        if (member3 != address(0)) members[idx++] = member3;
        if (member4 != address(0)) members[idx++] = member4;
        if (member5 != address(0)) members[idx++] = member5;

        return members;
    }
}

/*//////////////////////////////////////////////////////////////
                    DEPOSIT TO GROUP
//////////////////////////////////////////////////////////////*/

/**
 * @notice Deposits tokens to an escrow group.
 * @dev Requires GROUP_ADDRESS env var.
 */
contract DepositToGroup is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        GroupEscrow group = GroupEscrow(groupAddr);

        uint256 depositAmount = group.REQUIRED_DEPOSIT();
        address tokenAddr = address(group.TOKEN());

        console.log("Depositing to Group:");
        console.log("  Group:", groupAddr);
        console.log("  Amount:", depositAmount);

        vm.startBroadcast(deployerKey);

        // Approve token
        IERC20(tokenAddr).approve(groupAddr, depositAmount);

        // Deposit
        group.deposit();

        vm.stopBroadcast();

        console.log("Deposit successful!");
    }
}

/*//////////////////////////////////////////////////////////////
                    CREATE EXPENSE
//////////////////////////////////////////////////////////////*/

/**
 * @notice Creates an expense in a group.
 * @dev Requires GROUP_ADDRESS and EXPENSE_AMOUNT.
 */
contract CreateExpense is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        uint256 amount = vm.envUint("EXPENSE_AMOUNT");
        string memory ipfsCid = vm.envOr("IPFS_CID", string("QmPlaceholder"));

        GroupEscrow group = GroupEscrow(groupAddr);

        // Get participants (simplified - equal split among all members)
        address[] memory allMembers = group.getMembers();
        uint256[] memory shares = _calculateEqualShares(
            amount,
            allMembers.length
        );

        console.log("Creating Expense:");
        console.log("  Group:", groupAddr);
        console.log("  Amount:", amount);
        console.log("  Participants:", allMembers.length);

        vm.startBroadcast(deployerKey);

        uint256 expenseId = group.createExpense(
            amount,
            allMembers,
            shares,
            ipfsCid
        );

        vm.stopBroadcast();

        console.log("Expense created! ID:", expenseId);
    }

    function _calculateEqualShares(
        uint256 amount,
        uint256 count
    ) internal pure returns (uint256[] memory shares) {
        shares = new uint256[](count);
        uint256 baseShare = amount / count;
        uint256 remainder = amount % count;

        for (uint256 i = 0; i < count; i++) {
            shares[i] = baseShare;
        }
        if (remainder > 0) {
            shares[0] += remainder;
        }
    }
}

/*//////////////////////////////////////////////////////////////
                    ACCEPT EXPENSE
//////////////////////////////////////////////////////////////*/

/**
 * @notice Accepts an expense.
 * @dev Requires GROUP_ADDRESS and EXPENSE_ID.
 */
contract AcceptExpense is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        uint256 expenseId = vm.envUint("EXPENSE_ID");

        GroupEscrow group = GroupEscrow(groupAddr);

        console.log("Accepting Expense:");
        console.log("  Group:", groupAddr);
        console.log("  Expense ID:", expenseId);

        vm.startBroadcast(deployerKey);

        group.acceptExpense(expenseId);

        vm.stopBroadcast();

        console.log("Expense accepted!");
    }
}

/*//////////////////////////////////////////////////////////////
                    PROPOSE & VOTE CLOSE
//////////////////////////////////////////////////////////////*/

/**
 * @notice Proposes or votes to close a group.
 */
contract ProposeClose is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        GroupEscrow group = GroupEscrow(groupAddr);

        console.log("Proposing/Voting Close:");
        console.log("  Group:", groupAddr);

        vm.startBroadcast(deployerKey);

        if (!group.closeProposed()) {
            group.proposeClose();
            console.log("Close proposed!");
        } else {
            group.voteClose();
            console.log("Vote cast!");
        }

        vm.stopBroadcast();

        console.log("Group state:", uint256(group.state()));
    }
}

/*//////////////////////////////////////////////////////////////
                    WITHDRAW
//////////////////////////////////////////////////////////////*/

/**
 * @notice Withdraws balance from a closed group.
 */
contract WithdrawFromGroup is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();
        address deployer = vm.addr(deployerKey);

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        GroupEscrow group = GroupEscrow(groupAddr);

        uint256 balance = group.balances(deployer);

        console.log("Withdrawing from Group:");
        console.log("  Group:", groupAddr);
        console.log("  Balance:", balance);

        vm.startBroadcast(deployerKey);

        group.withdraw();

        vm.stopBroadcast();

        console.log("Withdrawal successful!");
    }
}

/*//////////////////////////////////////////////////////////////
                    VIEW GROUP INFO
//////////////////////////////////////////////////////////////*/

/**
 * @notice Views group information (read-only, no broadcast).
 */
contract ViewGroupInfo is Script {
    function run() external view {
        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        GroupEscrow group = GroupEscrow(groupAddr);

        (
            string memory name,
            address token,
            GroupEscrow.GroupState state,
            uint256 memberCount,
            uint256 depositCount
        ) = group.getGroupInfo();

        console.log("========================================");
        console.log("GROUP INFO");
        console.log("========================================");
        console.log("Address:", groupAddr);
        console.log("Name:", name);
        console.log("Token:", token);
        console.log("State:", uint256(state));
        console.log("Members:", memberCount);
        console.log("Deposits:", depositCount);
        console.log("Required Deposit:", group.REQUIRED_DEPOSIT());
        console.log("Deadline:", group.DEPOSIT_DEADLINE());
        console.log("Expense Count:", group.expenseCount());
        console.log("========================================");
    }
}

/*//////////////////////////////////////////////////////////////
                    DIRECT MODE SCRIPTS
//////////////////////////////////////////////////////////////*/

/**
 * @notice Creates a new direct-mode group via the factory.
 * @dev Auto-detects ChainSplitFactory and MockUSDC from deployment.
 *      Direct mode has no deposits - settlements use transferFrom.
 */
contract CreateDirectGroup is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        // Auto-detect or use env vars
        address factoryAddr = _getFactoryAddress();
        address tokenAddr = _getTokenAddress();

        ChainSplitFactory factory = ChainSplitFactory(factoryAddr);

        // Parse members from env
        address[] memory members = _parseMembers();

        string memory groupName = vm.envOr(
            "GROUP_NAME",
            string("Direct Group")
        );

        console.log("Creating Direct Group:");
        console.log("  Factory:", factoryAddr);
        console.log("  Token:", tokenAddr);
        console.log("  Name:", groupName);
        console.log("  Members:", members.length);

        vm.startBroadcast(deployerKey);

        address groupAddr = factory.createDirectGroup(
            groupName,
            tokenAddr,
            members
        );

        vm.stopBroadcast();

        console.log("");
        console.log("Direct Group created at:", groupAddr);
        console.log("");
        console.log("Next steps:");
        console.log(
            "  1. Members approve tokens: TOKEN.approve(GROUP_ADDRESS, amount)"
        );
        console.log("  2. Create expense: GROUP_ADDRESS=", groupAddr);
    }

    function _getFactoryAddress() internal view returns (address) {
        try vm.envAddress("FACTORY_ADDRESS") returns (address addr) {
            return addr;
        } catch {}
        return
            DevOpsTools.get_most_recent_deployment(
                "ChainSplitFactory",
                block.chainid
            );
    }

    function _getTokenAddress() internal view returns (address) {
        try vm.envAddress("TOKEN_ADDRESS") returns (address addr) {
            return addr;
        } catch {}
        return
            DevOpsTools.get_most_recent_deployment("MockUSDC", block.chainid);
    }

    function _parseMembers() internal view returns (address[] memory) {
        address member1 = vm.envOr("MEMBER_1", address(0));
        address member2 = vm.envOr("MEMBER_2", address(0));
        address member3 = vm.envOr("MEMBER_3", address(0));
        address member4 = vm.envOr("MEMBER_4", address(0));
        address member5 = vm.envOr("MEMBER_5", address(0));

        uint256 count = 0;
        if (member1 != address(0)) count++;
        if (member2 != address(0)) count++;
        if (member3 != address(0)) count++;
        if (member4 != address(0)) count++;
        if (member5 != address(0)) count++;

        address[] memory members = new address[](count);
        uint256 idx = 0;
        if (member1 != address(0)) members[idx++] = member1;
        if (member2 != address(0)) members[idx++] = member2;
        if (member3 != address(0)) members[idx++] = member3;
        if (member4 != address(0)) members[idx++] = member4;
        if (member5 != address(0)) members[idx++] = member5;

        return members;
    }
}

/**
 * @notice Creates an expense in a Direct group.
 * @dev Requires GROUP_ADDRESS and EXPENSE_AMOUNT.
 */
contract CreateDirectExpense is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        uint256 amount = vm.envUint("EXPENSE_AMOUNT");
        string memory ipfsCid = vm.envOr("IPFS_CID", string("QmDefaultCID"));

        GroupDirect group = GroupDirect(groupAddr);

        // Get all members as participants
        address[] memory allMembers = group.getMembers();

        // Calculate equal shares
        uint256[] memory shares = _calculateEqualShares(
            amount,
            allMembers.length
        );

        console.log("Creating Direct Expense:");
        console.log("  Group:", groupAddr);
        console.log("  Amount:", amount);
        console.log("  Participants:", allMembers.length);

        vm.startBroadcast(deployerKey);

        uint256 expenseId = group.createExpense(
            amount,
            allMembers,
            shares,
            ipfsCid
        );

        vm.stopBroadcast();

        console.log("Direct Expense created! ID:", expenseId);
        console.log("");
        console.log(
            "Next: Participants call acceptExpense, then payer calls settleExpense"
        );
    }

    function _calculateEqualShares(
        uint256 amount,
        uint256 count
    ) internal pure returns (uint256[] memory shares) {
        shares = new uint256[](count);
        uint256 baseShare = amount / count;
        uint256 remainder = amount % count;

        for (uint256 i = 0; i < count; i++) {
            shares[i] = baseShare;
        }
        if (remainder > 0) {
            shares[0] += remainder;
        }
    }
}

/**
 * @notice Accepts a Direct expense.
 * @dev Requires GROUP_ADDRESS and EXPENSE_ID.
 */
contract AcceptDirectExpense is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        uint256 expenseId = vm.envUint("EXPENSE_ID");

        GroupDirect group = GroupDirect(groupAddr);

        console.log("Accepting Direct Expense:");
        console.log("  Group:", groupAddr);
        console.log("  Expense ID:", expenseId);

        vm.startBroadcast(deployerKey);

        group.acceptExpense(expenseId);

        vm.stopBroadcast();

        console.log("Expense accepted!");
    }
}

/**
 * @notice Settles a Direct expense (pulls tokens from participants).
 * @dev Requires GROUP_ADDRESS and EXPENSE_ID. Only payer can call.
 */
contract SettleDirectExpense is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        uint256 expenseId = vm.envUint("EXPENSE_ID");

        GroupDirect group = GroupDirect(groupAddr);

        (address payer, uint256 amount, , , uint256 acceptedCount) = group
            .getExpense(expenseId);

        console.log("Settling Direct Expense:");
        console.log("  Group:", groupAddr);
        console.log("  Expense ID:", expenseId);
        console.log("  Payer:", payer);
        console.log("  Amount:", amount);
        console.log("  Accepted Count:", acceptedCount);

        vm.startBroadcast(deployerKey);

        group.settleExpense(expenseId);

        vm.stopBroadcast();

        console.log("Expense settled! Tokens transferred from participants.");
        console.log("Payer can now withdraw with: make direct-withdraw");
    }
}

/**
 * @notice Withdraws balance from a Direct group.
 * @dev Can withdraw anytime when you have positive withdrawable balance.
 */
contract WithdrawFromDirectGroup is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();
        address deployer = vm.addr(deployerKey);

        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        GroupDirect group = GroupDirect(groupAddr);

        uint256 withdrawable = group.getWithdrawableBalance(deployer);
        int256 netBalance = group.getBalance(deployer);

        console.log("Withdrawing from Direct Group:");
        console.log("  Group:", groupAddr);
        console.log("  Net Balance:", netBalance);
        console.log("  Withdrawable:", withdrawable);

        require(withdrawable > 0, "No balance to withdraw");

        vm.startBroadcast(deployerKey);

        group.withdraw();

        vm.stopBroadcast();

        console.log("Withdrawal successful!");
    }
}

/**
 * @notice Views Direct group information (read-only).
 */
contract ViewDirectGroupInfo is Script {
    function run() external view {
        address groupAddr = vm.envAddress("GROUP_ADDRESS");
        GroupDirect group = GroupDirect(groupAddr);

        (
            string memory name,
            address token,
            uint256 memberCount,
            uint256 expenseCount
        ) = group.getGroupInfo();

        console.log("========================================");
        console.log("DIRECT GROUP INFO");
        console.log("========================================");
        console.log("Address:", groupAddr);
        console.log("Name:", name);
        console.log("Token:", token);
        console.log("Members:", memberCount);
        console.log("Expenses:", expenseCount);
        console.log("----------------------------------------");

        // Show member balances
        address[] memory members = group.getMembers();
        console.log("Member Balances:");
        for (uint256 i = 0; i < members.length; i++) {
            int256 balance = group.getBalance(members[i]);
            uint256 withdrawable = group.getWithdrawableBalance(members[i]);
            console.log("  Member:", members[i]);
            console.log("    Net Balance:", balance);
            console.log("    Withdrawable:", withdrawable);
        }
        console.log("========================================");
    }
}
