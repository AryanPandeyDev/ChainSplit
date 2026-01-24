# ChainSplit Makefile
# Efficient commands for development, testing, and deployment

# Load environment variables from .env if it exists
-include .env

# Default network (override with NETWORK=sepolia make deploy)
NETWORK ?= anvil

# RPC URLs (configure in .env or override)
ANVIL_RPC_URL ?= http://localhost:8545
SEPOLIA_RPC_URL ?= https://sepolia.infura.io/v3/$(INFURA_KEY)
POLYGON_RPC_URL ?= https://polygon-mainnet.infura.io/v3/$(INFURA_KEY)
MUMBAI_RPC_URL ?= https://polygon-mumbai.infura.io/v3/$(INFURA_KEY)
BASE_RPC_URL ?= https://mainnet.base.org
BASE_SEPOLIA_RPC_URL ?= https://sepolia.base.org

# Get RPC URL based on network
ifeq ($(NETWORK),anvil)
	RPC_URL = $(ANVIL_RPC_URL)
else ifeq ($(NETWORK),sepolia)
	RPC_URL = $(SEPOLIA_RPC_URL)
else ifeq ($(NETWORK),polygon)
	RPC_URL = $(POLYGON_RPC_URL)
else ifeq ($(NETWORK),mumbai)
	RPC_URL = $(MUMBAI_RPC_URL)
else ifeq ($(NETWORK),base)
	RPC_URL = $(BASE_RPC_URL)
else ifeq ($(NETWORK),base-sepolia)
	RPC_URL = $(BASE_SEPOLIA_RPC_URL)
endif

# Common forge flags
FORGE_FLAGS = --rpc-url $(RPC_URL)
BROADCAST_FLAGS = $(FORGE_FLAGS) --broadcast

.PHONY: help build test clean deploy anvil

#=============================================================================
# HELP
#=============================================================================

help:
	@echo "ChainSplit - Development Commands"
	@echo ""
	@echo "Usage: make [command] [NETWORK=network]"
	@echo ""
	@echo "Build & Test:"
	@echo "  build          - Compile contracts"
	@echo "  test           - Run all tests"
	@echo "  test-v         - Run tests with verbose output"
	@echo "  test-gas       - Run tests with gas report"
	@echo "  coverage       - Run coverage report"
	@echo "  clean          - Clean build artifacts"
	@echo ""
	@echo "Local Development:"
	@echo "  anvil          - Start local Anvil node"
	@echo "  deploy-local   - Deploy to local Anvil"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy         - Deploy to NETWORK (default: anvil)"
	@echo "  deploy-sepolia - Deploy to Sepolia testnet"
	@echo "  deploy-mumbai  - Deploy to Polygon Mumbai"
	@echo "  deploy-base-sepolia - Deploy to Base Sepolia"
	@echo ""
	@echo "Interactions (requires GROUP_ADDRESS, etc.):"
	@echo "  create-group   - Create new escrow group"
	@echo "  deposit        - Deposit to group"
	@echo "  create-expense - Create expense"
	@echo "  accept-expense - Accept expense"
	@echo "  propose-close  - Propose/vote group closure"
	@echo "  withdraw       - Withdraw from closed group"
	@echo "  view-group     - View group info"
	@echo ""
	@echo "Networks: anvil, sepolia, mumbai, polygon, base, base-sepolia"
	@echo ""
	@echo "Examples:"
	@echo "  make deploy NETWORK=sepolia"
	@echo "  GROUP_ADDRESS=0x... make view-group NETWORK=sepolia"

#=============================================================================
# BUILD & TEST
#=============================================================================

build:
	forge build

test:
	forge test

test-v:
	forge test -vvv

test-vv:
	forge test -vvvv

test-gas:
	forge test --gas-report

test-match:
	forge test --match-test $(TEST_NAME) -vvvv

coverage:
	forge coverage

clean:
	forge clean

snapshot:
	forge snapshot

#=============================================================================
# LOCAL DEVELOPMENT
#=============================================================================

anvil:
	anvil

deploy-local:
	forge script script/Deploy.s.sol:DeployChainSplitLocal --rpc-url $(ANVIL_RPC_URL) --broadcast

#=============================================================================
# DEPLOYMENT
#=============================================================================

deploy:
	forge script script/Deploy.s.sol:DeployChainSplit $(BROADCAST_FLAGS)

deploy-dry:
	forge script script/Deploy.s.sol:DeployChainSplit $(FORGE_FLAGS) -vvvv

deploy-sepolia:
	NETWORK=sepolia $(MAKE) deploy

deploy-mumbai:
	NETWORK=mumbai $(MAKE) deploy

deploy-base-sepolia:
	NETWORK=base-sepolia $(MAKE) deploy

deploy-polygon:
	NETWORK=polygon $(MAKE) deploy --slow --verify

deploy-base:
	NETWORK=base $(MAKE) deploy --slow --verify

#=============================================================================
# VERIFY
#=============================================================================

verify:
	forge verify-contract $(CONTRACT_ADDRESS) src/ChainSplitFactory.sol:ChainSplitFactory \
		--chain $(NETWORK) \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

#=============================================================================
# INTERACTIONS
#=============================================================================

mint-tokens:
	forge script script/Interactions.s.sol:MintMockTokens $(BROADCAST_FLAGS)

create-group:
	forge script script/Interactions.s.sol:CreateEscrowGroup $(BROADCAST_FLAGS)

deposit:
	forge script script/Interactions.s.sol:DepositToGroup $(BROADCAST_FLAGS)

create-expense:
	forge script script/Interactions.s.sol:CreateExpense $(BROADCAST_FLAGS)

accept-expense:
	forge script script/Interactions.s.sol:AcceptExpense $(BROADCAST_FLAGS)

propose-close:
	forge script script/Interactions.s.sol:ProposeClose $(BROADCAST_FLAGS)

withdraw:
	forge script script/Interactions.s.sol:WithdrawFromGroup $(BROADCAST_FLAGS)

view-group:
	forge script script/Interactions.s.sol:ViewGroupInfo $(FORGE_FLAGS)

#=============================================================================
# UTILITIES
#=============================================================================

format:
	forge fmt

lint:
	forge fmt --check

slither:
	slither . --config-file slither.config.json

install:
	forge install

update:
	forge update

# Generate documentation
docs:
	forge doc

# Show contract sizes
sizes:
	forge build --sizes
