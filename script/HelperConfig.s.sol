// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

/**
 * @title HelperConfig
 * @notice Provides chain-specific configuration for deployments.
 * @dev Automatically detects chain and returns appropriate config.
 *
 * Supported Networks:
 * - Ethereum Mainnet (1)
 * - Sepolia (11155111)
 * - Polygon Mainnet (137)
 * - Polygon Mumbai (80001)
 * - Base Mainnet (8453)
 * - Base Sepolia (84532)
 * - Anvil Local (31337)
 *
 * Usage in deploy scripts:
 *   HelperConfig config = new HelperConfig();
 *   HelperConfig.NetworkConfig memory networkConfig = config.getActiveConfig();
 */
contract HelperConfig is Script {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Network-specific configuration
     * @param chainName Human-readable chain name
     * @param usdc USDC token address (for testing/reference)
     * @param usdt USDT token address (for testing/reference)
     * @param dai DAI token address (for testing/reference)
     * @param weth WETH token address (for native token wrapping)
     * @param blockConfirmations Number of block confirmations for tx safety
     * @param deployerKey Private key for deployment (only for local testing)
     */
    struct NetworkConfig {
        string chainName;
        address usdc;
        address usdt;
        address dai;
        address weth;
        uint256 blockConfirmations;
        uint256 deployerKey;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Active network configuration
    NetworkConfig public activeConfig;

    /// @notice Default Anvil private key (DO NOT USE IN PRODUCTION)
    uint256 public constant ANVIL_DEFAULT_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    /// @notice Mapping of chainId to config (for future extensibility)
    mapping(uint256 => NetworkConfig) public chainConfigs;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        // Initialize all supported chains
        _initializeChainConfigs();

        // Set active config based on current chain
        if (block.chainid == 1) {
            activeConfig = getEthereumMainnetConfig();
        } else if (block.chainid == 11155111) {
            activeConfig = getSepoliaConfig();
        } else if (block.chainid == 137) {
            activeConfig = getPolygonMainnetConfig();
        } else if (block.chainid == 80001) {
            activeConfig = getPolygonMumbaiConfig();
        } else if (block.chainid == 8453) {
            activeConfig = getBaseMainnetConfig();
        } else if (block.chainid == 84532) {
            activeConfig = getBaseSepoliaConfig();
        } else {
            // Default to Anvil/local config
            activeConfig = getAnvilConfig();
        }
    }

    /*//////////////////////////////////////////////////////////////
                          CONFIG GETTERS
    //////////////////////////////////////////////////////////////*/

    function getActiveConfig() external view returns (NetworkConfig memory) {
        return activeConfig;
    }

    function getConfigByChainId(
        uint256 chainId
    ) external view returns (NetworkConfig memory) {
        return chainConfigs[chainId];
    }

    /*//////////////////////////////////////////////////////////////
                        CHAIN CONFIGURATIONS
    //////////////////////////////////////////////////////////////*/

    function getEthereumMainnetConfig()
        public
        pure
        returns (NetworkConfig memory)
    {
        return
            NetworkConfig({
                chainName: "Ethereum Mainnet",
                usdc: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
                usdt: 0xdAC17F958D2ee523a2206206994597C13D831ec7,
                dai: 0x6B175474E89094C44Da98b954EedeAC495271d0F,
                weth: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
                blockConfirmations: 6,
                deployerKey: 0 // Must be provided via environment
            });
    }

    function getSepoliaConfig() public pure returns (NetworkConfig memory) {
        return
            NetworkConfig({
                chainName: "Sepolia Testnet",
                // Sepolia testnet token addresses (may vary)
                usdc: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238, // Circle's testnet USDC
                usdt: address(0), // Not commonly available on Sepolia
                dai: address(0),
                weth: 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9,
                blockConfirmations: 3,
                deployerKey: 0
            });
    }

    function getPolygonMainnetConfig()
        public
        pure
        returns (NetworkConfig memory)
    {
        return
            NetworkConfig({
                chainName: "Polygon Mainnet",
                usdc: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359, // Native USDC on Polygon
                usdt: 0xc2132D05D31c914a87C6611C10748AEb04B58e8F,
                dai: 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063,
                weth: 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619,
                blockConfirmations: 256, // Polygon reorgs can be deep
                deployerKey: 0
            });
    }

    function getPolygonMumbaiConfig()
        public
        pure
        returns (NetworkConfig memory)
    {
        return
            NetworkConfig({
                chainName: "Polygon Mumbai Testnet",
                usdc: 0x0FA8781a83E46826621b3BC094Ea2A0212e71B23, // Mumbai test USDC
                usdt: address(0),
                dai: address(0),
                weth: 0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa,
                blockConfirmations: 5,
                deployerKey: 0
            });
    }

    function getBaseMainnetConfig() public pure returns (NetworkConfig memory) {
        return
            NetworkConfig({
                chainName: "Base Mainnet",
                usdc: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, // Native USDC on Base
                usdt: address(0), // Not widely used on Base
                dai: 0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb,
                weth: 0x4200000000000000000000000000000000000006,
                blockConfirmations: 6,
                deployerKey: 0
            });
    }

    function getBaseSepoliaConfig() public pure returns (NetworkConfig memory) {
        return
            NetworkConfig({
                chainName: "Base Sepolia Testnet",
                usdc: 0x036CbD53842c5426634e7929541eC2318f3dCF7e, // Base Sepolia test USDC
                usdt: address(0),
                dai: address(0),
                weth: 0x4200000000000000000000000000000000000006,
                blockConfirmations: 3,
                deployerKey: 0
            });
    }

    function getAnvilConfig() public pure returns (NetworkConfig memory) {
        return
            NetworkConfig({
                chainName: "Anvil Local",
                usdc: address(0), // Will be deployed by test setup
                usdt: address(0),
                dai: address(0),
                weth: address(0),
                blockConfirmations: 1,
                deployerKey: ANVIL_DEFAULT_KEY
            });
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _initializeChainConfigs() internal {
        chainConfigs[1] = getEthereumMainnetConfig();
        chainConfigs[11155111] = getSepoliaConfig();
        chainConfigs[137] = getPolygonMainnetConfig();
        chainConfigs[80001] = getPolygonMumbaiConfig();
        chainConfigs[8453] = getBaseMainnetConfig();
        chainConfigs[84532] = getBaseSepoliaConfig();
        chainConfigs[31337] = getAnvilConfig();
    }

    /*//////////////////////////////////////////////////////////////
                          UTILITY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if current chain is a testnet
     */
    function isTestnet() external view returns (bool) {
        return
            block.chainid == 11155111 || // Sepolia
            block.chainid == 80001 || // Mumbai
            block.chainid == 84532 || // Base Sepolia
            block.chainid == 31337; // Anvil
    }

    /**
     * @notice Checks if current chain is mainnet
     */
    function isMainnet() external view returns (bool) {
        return
            block.chainid == 1 || // Ethereum
            block.chainid == 137 || // Polygon
            block.chainid == 8453; // Base
    }

    /**
     * @notice Returns the deployer key (from env or default for Anvil)
     * @dev Checks PRIVATE_KEY env var first, falls back to Anvil default
     */
    function getDeployerKey() external view returns (uint256) {
        // Always try env var first (allows overriding on any chain)
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            return key;
        } catch {}
        // Fall back to Anvil default on local chain
        if (block.chainid == 31337) {
            return ANVIL_DEFAULT_KEY;
        }

        // No key available for non-Anvil chains
        revert("PRIVATE_KEY env var required");
    }
}
