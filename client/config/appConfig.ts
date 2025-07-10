// Client-side configuration for CollateralSwap DApp
// All API endpoints, contract addresses, and app settings are centralized here

// API Configuration
export const API_CONFIG = {
    // Backend API base URL
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',

    // API endpoints
    ENDPOINTS: {
        // Order management
        ORDER_CREATE: '/api/orders/create',
        ORDER_LIST: '/api/orders/list',
        ORDER_FILL: '/api/orders/fill',
        ORDER_SYNC: '/api/orders/sync',
        ORDER_SYNC_STATUS: '/api/orders/sync/status',
    }
}

// Contract Addresses Configuration
export const CONTRACT_CONFIG = {
    // Main contracts
    PIV_ADDRESS: process.env.NEXT_PUBLIC_PIV_ADDRESS || '0x0000000000000000000000000000000000000000',
    ROUTER_ADDRESS: process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '0xEf40d19494C4e99075CD445A3f24161bEE3BE3b8',

    // Token addresses (replace with actual deployed addresses)
    TOKENS: {
        USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        USDT: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
        WBTC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x29f2D40B0605204364af54EC677bD022dA425d03',
        LINK: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5',
        AAVE: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a',
        EURS: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x6d906e526a4e2Ca02097BA9d0caA3c382F52278E',
        // Add more tokens as needed
    },


    // Network configuration
    CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', // Sepolia testnet by default
    NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia',

    // RPC Configuration
    RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.zan.top/node/v1/eth/sepolia/e6bd8c0b823d40bc88306c09ee218515',
    SEPOLIA_RPC_URL: 'https://api.zan.top/node/v1/eth/sepolia/e6bd8c0b823d40bc88306c09ee218515',

    // Aave V3 Sepolia Configuration (using @bgd-labs/aave-address-book)
    // These are handled automatically by the address book, but kept for reference
    AAVE_POOL_ADDRESSES_PROVIDER: '0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A', // Sepolia
    AAVE_UI_POOL_DATA_PROVIDER: '0x69529987FA4A075D0C00B0128fa848dc9ebbE9CE', // Sepolia  
    AAVE_UI_INCENTIVE_DATA_PROVIDER: '0x162A7AC02f547ad796CA549f757e2b8d174C5108', // Sepolia

}

// DApp Settings
export const APP_CONFIG = {
    // Application metadata
    NAME: 'CollateralSwap',
    VERSION: '1.0.0',
    DESCRIPTION: 'Decentralized Collateral Swap Platform',

    // Trading settings
    DEFAULT_SLIPPAGE: 0.05, // 5%
    MAX_SLIPPAGE: 0.5, // 50%
    MIN_SLIPPAGE: 0.001, // 0.1%

    // UI settings
    DECIMAL_PLACES: 6,
    MAX_DECIMAL_PLACES: 18,

    // Order book settings
    DEFAULT_PAGE_SIZE: 20,
    MAX_ORDERS_PER_PAGE: 100,

    // Refresh intervals (in milliseconds)
    ORDER_REFRESH_INTERVAL: 30000, // 30 seconds
    PRICE_REFRESH_INTERVAL: 10000, // 10 seconds
    SYNC_STATUS_REFRESH_INTERVAL: 60000, // 1 minute
}

// Token Configuration
export const TOKEN_CONFIG = {
    // Supported tokens list
    SUPPORTED_TOKENS: [
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: CONTRACT_CONFIG.TOKENS.USDC,
            decimals: 6,
        },
        {
            symbol: 'USDT',
            name: 'Tether USD',
            address: CONTRACT_CONFIG.TOKENS.USDT,
            decimals: 6,
        },
        {
            symbol: 'WBTC',
            name: 'Wrapped Bitcoin',
            address: CONTRACT_CONFIG.TOKENS.WBTC,
            decimals: 8,
        },
        {
            symbol: 'LINK',
            name: 'Chainlink',
            address: CONTRACT_CONFIG.TOKENS.LINK,
            decimals: 18,
        },
        {
            symbol: 'AAVE',
            name: 'Aave',
            address: CONTRACT_CONFIG.TOKENS.AAVE,
            decimals: 18,
        },
        {
            symbol: 'EURS',
            name: 'STASIS EURS',
            address: CONTRACT_CONFIG.TOKENS.EURS,
            decimals: 2,
        }
    ],

    // Default token pair
    DEFAULT_TOKEN_IN: 'USDC',
    DEFAULT_TOKEN_OUT: 'WBTC',
}

// Contract ABIs
export const CONTRACT_ABIS = {
    // IRouter ABI
    IROUTER: [
        {
            "inputs": [
                { "internalType": "address", "name": "aavePool", "type": "address" },
                { "internalType": "address", "name": "aaveAddressProvider", "type": "address" }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
            "name": "SafeERC20FailedOperation",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": false, "internalType": "address", "name": "owner", "type": "address" },
                { "indexed": false, "internalType": "address", "name": "pivAddress", "type": "address" }
            ],
            "name": "PIVDeployed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "tokenIn", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "tokenOut", "type": "address" },
                { "indexed": false, "internalType": "address", "name": "caller", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "finalAmountOut", "type": "uint256" }
            ],
            "name": "SwapExecuted",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "ADDRESSES_PROVIDER",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "POOL",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "deployPIV",
            "outputs": [{ "internalType": "address", "name": "pivAddress", "type": "address" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        { "internalType": "address", "name": "tokenIn", "type": "address" },
                        { "internalType": "address", "name": "tokenOut", "type": "address" },
                        { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                        { "internalType": "uint256", "name": "minAmountOut", "type": "uint256" },
                        {
                            "components": [
                                { "internalType": "address", "name": "pivAddress", "type": "address" },
                                { "internalType": "uint256[]", "name": "orderIds", "type": "uint256[]" }
                            ],
                            "internalType": "struct IRouter.OrderData[]",
                            "name": "orderDatas",
                            "type": "tuple[]"
                        }
                    ],
                    "internalType": "struct IRouter.SwapData",
                    "name": "swapData",
                    "type": "tuple"
                }
            ],
            "name": "swap",
            "outputs": [
                { "internalType": "uint256", "name": "netAmountOut", "type": "uint256" },
                { "internalType": "uint256", "name": "totalInputAmount", "type": "uint256" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ],

    // IPIV ABI
    IPIV: [
        {
            "inputs": [
                { "internalType": "address", "name": "aavePool", "type": "address" },
                { "internalType": "address", "name": "aaveAddressProvider", "type": "address" },
                { "internalType": "address", "name": "admin", "type": "address" }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "OwnableInvalidOwner",
            "type": "error"
        },
        {
            "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
            "name": "OwnableUnauthorizedAccount",
            "type": "error"
        },
        {
            "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
            "name": "SafeERC20FailedOperation",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "collateralToken", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "debtToken", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "collateralAmount", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "newDebtAmount", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }
            ],
            "name": "LoanMigrated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256" }
            ],
            "name": "OrderCancelled",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
                { "indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256" },
                { "indexed": false, "internalType": "address", "name": "collateralToken", "type": "address" },
                { "indexed": false, "internalType": "address", "name": "debtToken", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "collateralAmount", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }
            ],
            "name": "OrderPlaced",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "tradingAmount", "type": "uint256" }
            ],
            "name": "OrderTraded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
            ],
            "name": "OrderUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "ADDRESSES_PROVIDER",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "POOL",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }],
            "name": "atokenAddress",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "orderId", "type": "uint256" }],
            "name": "cancelOrder",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "name": "collateralOnSold",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "asset", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" },
                { "internalType": "uint256", "name": "premium", "type": "uint256" },
                { "internalType": "address", "name": "", "type": "address" },
                { "internalType": "bytes", "name": "params", "type": "bytes" }
            ],
            "name": "executeOperation",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
            "name": "getBalance",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "contract IERC20", "name": "collateralToken", "type": "address" },
                { "internalType": "uint256", "name": "collateralAmount", "type": "uint256" },
                { "internalType": "contract IERC20", "name": "debtToken", "type": "address" },
                { "internalType": "uint256", "name": "debtAmount", "type": "uint256" },
                { "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }
            ],
            "name": "migrateFromAave",
            "outputs": [{ "internalType": "uint256", "name": "newDebtAmount", "type": "uint256" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "name": "orderMapping",
            "outputs": [
                { "internalType": "address", "name": "collateralToken", "type": "address" },
                { "internalType": "address", "name": "debtToken", "type": "address" },
                { "internalType": "uint256", "name": "collateralAmount", "type": "uint256" },
                { "internalType": "uint256", "name": "remainingCollateral", "type": "uint256" },
                { "internalType": "uint256", "name": "price", "type": "uint256" },
                { "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "collateralToken", "type": "address" },
                { "internalType": "uint256", "name": "collateralAmount", "type": "uint256" },
                { "internalType": "address", "name": "debtToken", "type": "address" },
                { "internalType": "uint256", "name": "price", "type": "uint256" },
                { "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }
            ],
            "name": "placeOrder",
            "outputs": [{ "internalType": "uint256", "name": "orderId", "type": "uint256" }],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "uint256[]", "name": "orderIds", "type": "uint256[]" },
                { "internalType": "uint256", "name": "tradingAmount", "type": "uint256" }
            ],
            "name": "previewSwap",
            "outputs": [
                { "internalType": "uint256", "name": "collateralOutput", "type": "uint256" },
                { "internalType": "uint256", "name": "debtInput", "type": "uint256" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "renounceOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "uint256[]", "name": "orderIds", "type": "uint256[]" },
                { "internalType": "uint256", "name": "tradingAmount", "type": "uint256" },
                { "internalType": "address", "name": "recipient", "type": "address" }
            ],
            "name": "swap",
            "outputs": [
                { "internalType": "uint256", "name": "totalCollateralOutput", "type": "uint256" },
                { "internalType": "uint256", "name": "totalDebtInput", "type": "uint256" }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalOrders",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "uint256", "name": "orderId", "type": "uint256" },
                { "internalType": "uint256", "name": "price", "type": "uint256" }
            ],
            "name": "updateOrder",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "token", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" },
                { "internalType": "address", "name": "recipient", "type": "address" }
            ],
            "name": "withdrawAssets",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ],
}

// Environment validation
export const validateConfig = () => {
    const errors: string[] = []

    // Check required contract addresses
    if (CONTRACT_CONFIG.PIV_ADDRESS === '0x0000000000000000000000000000000000000000') {
        errors.push('PIV_ADDRESS not configured')
    }

    if (CONTRACT_CONFIG.ROUTER_ADDRESS === '0x0000000000000000000000000000000000000000') {
        errors.push('ROUTER_ADDRESS not configured')
    }

    // Check API base URL
    if (!API_CONFIG.BASE_URL) {
        errors.push('API_BASE_URL not configured')
    }

    if (errors.length > 0) {
        console.warn('Configuration warnings:', errors)
    }

    return errors.length === 0
}

// Helper functions
export const getTokenBySymbol = (symbol: string) => {
    return TOKEN_CONFIG.SUPPORTED_TOKENS.find(token => token.symbol === symbol)
}

export const getTokenByAddress = (address: string) => {
    return TOKEN_CONFIG.SUPPORTED_TOKENS.find(token =>
        token.address.toLowerCase() === address.toLowerCase()
    )
}

export const formatApiUrl = (endpoint: string) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const getContractAddress = (contractName: keyof typeof CONTRACT_CONFIG) => {
    return CONTRACT_CONFIG[contractName]
}

// Export default configuration object
export default {
    API_CONFIG,
    CONTRACT_CONFIG,
    APP_CONFIG,
    TOKEN_CONFIG,
    CONTRACT_ABIS,
    validateConfig,
    getTokenBySymbol,
    getTokenByAddress,
    formatApiUrl,
    getContractAddress,
}
