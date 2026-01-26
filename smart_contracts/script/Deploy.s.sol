// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ChainSplitFactory} from "../src/ChainSplitFactory.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

/**
 * @title DeployChainSplit
 * @notice Production deployment script for ChainSplit factory.
 * @dev Uses HelperConfig for chain-specific settings.
 *
 * Usage:
 *   # Local (Anvil)
 *   forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
 *
 *   # Testnet (Sepolia)
 *   forge script script/Deploy.s.sol --broadcast --rpc-url $SEPOLIA_RPC_URL --verify
 *
 *   # Mainnet (with extra safety)
 *   forge script script/Deploy.s.sol --broadcast --rpc-url $MAINNET_RPC_URL --verify --slow
 *
 * Environment Variables:
 *   PRIVATE_KEY          - Deployer's private key (required for non-Anvil)
 *   ETHERSCAN_API_KEY    - For contract verification
 */
contract DeployChainSplit is Script {
    /*//////////////////////////////////////////////////////////////
                              DEPLOYMENT
    //////////////////////////////////////////////////////////////*/

    function run()
        external
        returns (ChainSplitFactory factory, HelperConfig helperConfig)
    {
        // Initialize config
        helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig
            .getActiveConfig();

        // Get deployer key
        uint256 deployerKey = helperConfig.getDeployerKey();
        address deployer = vm.addr(deployerKey);

        // Pre-deployment logging
        _logDeploymentInfo(config, deployer);

        // Mainnet safety check
        if (helperConfig.isMainnet()) {
            _mainnetSafetyCheck(deployer);
        }

        // Execute deployment
        vm.startBroadcast(deployerKey);

        factory = new ChainSplitFactory();

        vm.stopBroadcast();

        // Post-deployment logging
        _logDeploymentSuccess(address(factory), config);

        return (factory, helperConfig);
    }

    /*//////////////////////////////////////////////////////////////
                          LOGGING HELPERS
    //////////////////////////////////////////////////////////////*/

    function _logDeploymentInfo(
        HelperConfig.NetworkConfig memory config,
        address deployer
    ) internal pure {
        console.log("");
        console.log("========================================");
        console.log("    CHAINSPLIT DEPLOYMENT");
        console.log("========================================");
        console.log("");
        console.log("Network:", config.chainName);
        console.log("Deployer:", deployer);
        console.log("Block Confirmations:", config.blockConfirmations);
        console.log("");

        if (config.usdc != address(0)) {
            console.log("Reference Tokens:");
            console.log("  USDC:", config.usdc);
            if (config.usdt != address(0)) console.log("  USDT:", config.usdt);
            if (config.dai != address(0)) console.log("  DAI:", config.dai);
            console.log("");
        }
    }

    function _logDeploymentSuccess(
        address factory,
        HelperConfig.NetworkConfig memory config
    ) internal pure {
        console.log("========================================");
        console.log("    DEPLOYMENT SUCCESSFUL");
        console.log("========================================");
        console.log("");
        console.log("ChainSplitFactory:", factory);
        console.log("");
        console.log("Next Steps:");
        console.log("1. Verify contract:");
        console.log("   forge verify-contract", factory, "ChainSplitFactory");
        console.log("");
        console.log("2. Create a test group with USDC:");
        if (config.usdc != address(0)) {
            console.log("   Token:", config.usdc);
        } else {
            console.log("   (Deploy your own test token first)");
        }
        console.log("");
        console.log("========================================");
    }

    function _mainnetSafetyCheck(address deployer) internal pure {
        console.log("");
        console.log("!!! MAINNET DEPLOYMENT !!!");
        console.log("");
        console.log("Deployer address:", deployer);
        console.log("");
        console.log("Please verify:");
        console.log("  1. You are deploying to the correct network");
        console.log("  2. The deployer has sufficient ETH for gas");
        console.log("  3. You have tested on testnet first");
        console.log("");
        console.log("Proceeding with deployment...");
        console.log("");
    }
}

/**
 * @title DeployChainSplitLocal
 * @notice Local development deployment with mock tokens.
 * @dev Deploys factory + mock USDC for local testing.
 */
contract DeployChainSplitLocal is Script {
    function run()
        external
        returns (
            ChainSplitFactory factory,
            address mockUsdc,
            HelperConfig helperConfig
        )
    {
        helperConfig = new HelperConfig();
        uint256 deployerKey = helperConfig.getDeployerKey();

        console.log("");
        console.log("========================================");
        console.log("    LOCAL DEVELOPMENT DEPLOYMENT");
        console.log("========================================");
        console.log("");

        vm.startBroadcast(deployerKey);

        // Deploy mock USDC for local testing
        // Using inline bytecode to avoid import issues
        MockUSDC mock = new MockUSDC();
        mockUsdc = address(mock);

        // Deploy factory
        factory = new ChainSplitFactory();

        vm.stopBroadcast();

        console.log("MockUSDC deployed:", mockUsdc);
        console.log("ChainSplitFactory deployed:", address(factory));
        console.log("");
        console.log("Test accounts (Anvil defaults):");
        console.log(
            "  Account 0:",
            vm.addr(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        console.log(
            "  Account 1:",
            vm.addr(
                0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
            )
        );
        console.log("");
        console.log("========================================");
    }
}

/**
 * @title MockUSDC
 * @notice Simple mock token for local testing
 */
contract MockUSDC {
    string public name = "Mock USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
