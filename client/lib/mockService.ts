// Mock service for testing frontend functionality
// This replaces actual backend API calls and contract interactions

import { Order, FillOrderRequest, FillOrderResponse, CreateOrderRequest } from './api'

// Mock data storage
let mockOrders: Order[] = [
    {
        _id: 'order1',
        orderId: '1',
        owner: '0x1234567890123456789012345678901234567890',
        collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
        collateralAmount: '2000000000000000000', // 2 WETH (18 decimals)
        price: '2000000000', // 2000 USDC per WETH (6 decimals)
        status: 'OPEN',
        filledAmount: '0',
        interestRateMode: '1',
        isFromBlockchain: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: 'order2',
        orderId: '2',
        owner: '0x2345678901234567890123456789012345678901',
        collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
        debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        collateralAmount: '4000000000', // 4000 USDC (6 decimals)
        price: '500000000000000', // 0.0005 WETH per USDC (inverted price, 18 decimals)
        status: 'OPEN',
        filledAmount: '0',
        interestRateMode: '1',
        isFromBlockchain: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    // Add more orders for better test coverage
    {
        _id: 'order3',
        orderId: '3',
        owner: '0x1111111111111111111111111111111111111111',
        collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
        collateralAmount: '1000000000000000000', // 1 WETH
        price: '2000000000', // 2000 USDC per WETH
        status: 'OPEN',
        filledAmount: '0',
        interestRateMode: '1',
        isFromBlockchain: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: 'order4',
        orderId: '4',
        owner: '0x2222222222222222222222222222222222222222',
        collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
        collateralAmount: '3000000000000000000', // 3 WETH
        price: '2000000000', // 2000 USDC per WETH
        status: 'OPEN',
        filledAmount: '0',
        interestRateMode: '1',
        isFromBlockchain: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
]

let mockWalletConnected = false
let mockUserAddress = '0x1234567890123456789012345678901234567890'
let mockChainId = 1

// Mock wallet interface
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>
            on: (event: string, callback: (...args: any[]) => void) => void
            removeListener: (event: string, callback: (...args: any[]) => void) => void
        }
    }
}

// Mock Web3 Provider
export const mockWeb3Provider = {
    // Mock wallet connection
    mockConnectWallet: () => {
        mockWalletConnected = true
        return Promise.resolve([mockUserAddress])
    },

    // Mock wallet disconnection
    mockDisconnectWallet: () => {
        mockWalletConnected = false
        return Promise.resolve()
    },

    // Mock getting accounts
    mockGetAccounts: () => {
        return Promise.resolve(mockWalletConnected ? [mockUserAddress] : [])
    },

    // Mock chain ID
    mockGetChainId: () => {
        return Promise.resolve(`0x${mockChainId.toString(16)}`)
    }
}

// Mock API responses
export const mockApi = {
    // Mock get orders
    getOrders: async (): Promise<Order[]> => {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
        return [...mockOrders]
    },

    // Mock create order
    createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const newOrder: Order = {
            _id: `order${mockOrders.length + 1}`,
            orderId: `${mockOrders.length + 1}`,
            ...orderData,
            status: 'OPEN',
            filledAmount: '0',
            interestRateMode: '1',
            isFromBlockchain: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        mockOrders.push(newOrder)
        return newOrder
    },

    // Mock fill order (swap)
    fillOrder: async (fillData: FillOrderRequest): Promise<FillOrderResponse> => {
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Find matching orders
        const matchingOrders = mockOrders.filter(order =>
            order.status === 'OPEN' &&
            order.collateralToken === fillData.tokenOut &&
            order.debtToken === fillData.tokenIn
        )

        if (matchingOrders.length === 0) {
            throw new Error('No matching orders found')
        }

        // Simulate order matching
        const totalAmountIn = BigInt(fillData.amountIn)
        let totalAmountOut = BigInt(0)
        let remainingAmountIn = totalAmountIn
        const matchDetails = []

        for (const order of matchingOrders.slice(0, 3)) { // Use first 3 orders
            if (remainingAmountIn <= 0) break

            const orderPrice = BigInt(order.price)
            const availableCollateral = BigInt(order.collateralAmount) - BigInt(order.filledAmount)

            // Calculate fill amounts based on token types
            let fillAmountIn: bigint
            let outputAmount: bigint

            if (fillData.tokenIn === '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2') {
                // USDC input -> WETH output
                // Price is 2000000000 = 2000 USDC per WETH (in USDC with 6 decimals)
                // To get WETH: USDC_amount / price = WETH_amount

                fillAmountIn = remainingAmountIn > availableCollateral ? availableCollateral : remainingAmountIn
                // Convert: 1000000000 USDC (1000 USDC) / 2000000000 (2000 USDC) = 0.5 * 1e18 WETH
                outputAmount = (fillAmountIn * BigInt('1000000000000000000')) / orderPrice

                if (outputAmount > availableCollateral) {
                    outputAmount = availableCollateral
                    // Recalculate fillAmountIn based on available collateral
                    fillAmountIn = (outputAmount * orderPrice) / BigInt('1000000000000000000')
                }
            } else {
                // WETH input -> USDC output  
                fillAmountIn = remainingAmountIn > availableCollateral ? availableCollateral : remainingAmountIn
                // Convert WETH to USDC: multiply by price and adjust decimals
                outputAmount = (fillAmountIn * orderPrice) / BigInt('1000000000000000000') // Scale down from 18 to 6 decimals

                if (outputAmount > availableCollateral) {
                    outputAmount = availableCollateral
                    fillAmountIn = (outputAmount * BigInt('1000000000000000000')) / orderPrice
                }
            }

            matchDetails.push({
                orderId: order._id,
                fillIn: fillAmountIn.toString(),
                fillOut: outputAmount.toString(),
                price: order.price
            })

            totalAmountOut += outputAmount
            remainingAmountIn -= fillAmountIn

            // Update mock order
            const newFilledAmount = BigInt(order.filledAmount) + outputAmount
            order.filledAmount = newFilledAmount.toString()
            if (newFilledAmount >= BigInt(order.collateralAmount)) {
                order.status = 'FILLED'
            }
        }

        return {
            totalIn: totalAmountIn.toString(),
            totalOut: totalAmountOut.toString(),
            matchDetails,
            swapNetAmountOut: totalAmountOut.toString(),
            swapTotalInputAmount: totalAmountIn.toString()
        }
    },

    // Mock sync orders
    syncOrders: async (): Promise<{ message: string }> => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { message: 'Mock sync completed successfully' }
    },

    // Mock sync status
    getSyncStatus: async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
        return {
            isRunning: false,
            pivAddress: '0x1234567890123456789012345678901234567890',
            contractInitialized: true
        }
    }
}

// Mock contract interactions
export const mockContracts = {
    // Mock PIV contract
    piv: {
        totalOrders: async () => {
            await new Promise(resolve => setTimeout(resolve, 800))
            return mockOrders.length
        },

        placeOrder: async (
            collateralToken: string,
            collateralAmount: string,
            debtToken: string,
            price: string,
            interestRateMode: string
        ) => {
            await new Promise(resolve => setTimeout(resolve, 2000))

            const orderId = mockOrders.length + 1
            const newOrder: Order = {
                _id: `order${orderId}`,
                orderId: orderId.toString(),
                owner: mockUserAddress,
                collateralToken,
                debtToken,
                collateralAmount,
                price,
                status: 'OPEN',
                filledAmount: '0',
                interestRateMode,
                isFromBlockchain: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            mockOrders.push(newOrder)

            return {
                wait: async () => ({
                    transactionHash: `0x${Math.random().toString(16).slice(2)}`,
                    logs: []
                })
            }
        },

        migrateFromAave: async (
            collateralToken: string,
            collateralAmount: string,
            debtToken: string,
            debtAmount: string,
            interestRateMode: string
        ) => {
            await new Promise(resolve => setTimeout(resolve, 3000))

            const newDebtAmount = (BigInt(debtAmount) * BigInt(95) / BigInt(100)).toString() // 5% reduction

            return {
                wait: async () => ({
                    transactionHash: `0x${Math.random().toString(16).slice(2)}`,
                    logs: [],
                    events: [{
                        args: {
                            user: mockUserAddress,
                            collateralToken,
                            debtToken,
                            collateralAmount,
                            newDebtAmount,
                            interestRateMode
                        }
                    }]
                })
            }
        },

        cancelOrder: async (orderId: string) => {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const order = mockOrders.find(o => o.orderId === orderId)
            if (order) {
                order.status = 'CANCELLED'
            }

            return {
                wait: async () => ({
                    transactionHash: `0x${Math.random().toString(16).slice(2)}`,
                    logs: []
                })
            }
        }
    },

    // Mock Router contract
    router: {
        swap: async (swapData: any) => {
            await new Promise(resolve => setTimeout(resolve, 2500))

            const netAmountOut = BigInt(swapData.amountIn) * BigInt(95) / BigInt(100) // 5% slippage

            return {
                wait: async () => ({
                    transactionHash: `0x${Math.random().toString(16).slice(2)}`,
                    logs: [{
                        topics: ['0x' + 'SwapExecuted'.padEnd(64, '0')],
                        data: '0x'
                    }]
                }),
                netAmountOut: netAmountOut.toString(),
                totalInputAmount: swapData.amountIn
            }
        }
    }
}

// Mock utilities
export const mockUtils = {
    // Reset mock data
    resetMockData: () => {
        mockOrders = [
            {
                _id: 'order1',
                orderId: '1',
                owner: '0x1234567890123456789012345678901234567890',
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000',
                price: '2000000000000000000',
                status: 'OPEN',
                filledAmount: '0',
                interestRateMode: '1',
                isFromBlockchain: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        ]
    },

    // Add mock order
    addMockOrder: (order: Partial<Order>) => {
        const newOrder: Order = {
            _id: `order${mockOrders.length + 1}`,
            orderId: `${mockOrders.length + 1}`,
            owner: mockUserAddress,
            collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateralAmount: '1000000000',
            price: '2000000000000000000',
            status: 'OPEN',
            filledAmount: '0',
            interestRateMode: '1',
            isFromBlockchain: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...order
        }
        mockOrders.push(newOrder)
        return newOrder
    },

    // Get mock orders
    getMockOrders: () => [...mockOrders],

    // Set wallet connection status
    setWalletConnected: (connected: boolean) => {
        mockWalletConnected = connected
    },

    // Get wallet connection status
    isWalletConnected: () => mockWalletConnected,

    // Set user address
    setUserAddress: (address: string) => {
        mockUserAddress = address
    },

    // Get user address
    getUserAddress: () => mockUserAddress
}

// Setup mock environment
export const setupMockEnvironment = () => {
    // Mock window.ethereum
    if (typeof window !== 'undefined') {
        window.ethereum = {
            request: async ({ method, params }) => {
                switch (method) {
                    case 'eth_requestAccounts':
                        return mockWeb3Provider.mockConnectWallet()
                    case 'eth_accounts':
                        return mockWeb3Provider.mockGetAccounts()
                    case 'eth_chainId':
                        return mockWeb3Provider.mockGetChainId()
                    default:
                        return Promise.resolve(null)
                }
            },
            on: (event: string, callback: (...args: any[]) => void) => {
                // Mock event listeners
            },
            removeListener: (event: string, callback: (...args: any[]) => void) => {
                // Mock event listener removal
            }
        }
    }
}

export default {
    mockApi,
    mockContracts,
    mockWeb3Provider,
    mockUtils,
    setupMockEnvironment
}
