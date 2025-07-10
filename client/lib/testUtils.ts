// Test utilities and hooks for mock testing
import { useState, useEffect } from 'react'
import { mockApi, mockContracts, mockUtils, setupMockEnvironment } from './mockService'
import { CONTRACT_ABIS } from '../config/appConfig'

// Mock mode flag
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development'

// Mock hooks
export function useMockIRouter() {
    const [isLoading, setIsLoading] = useState(false)

    const swapWithRouter = async (swapData: any) => {
        if (!MOCK_MODE) {
            throw new Error('Mock mode not enabled')
        }

        setIsLoading(true)
        try {
            const result = await mockContracts.router.swap(swapData)
            return result
        } finally {
            setIsLoading(false)
        }
    }

    return {
        swapWithRouter,
        isLoading
    }
}

export function useMockPivOrderBook() {
    const [isLoading, setIsLoading] = useState(false)

    const getTotalOrders = async () => {
        if (!MOCK_MODE) return 0
        return await mockContracts.piv.totalOrders()
    }

    const placeOrder = async (
        collateralToken: string,
        collateralAmount: string,
        debtToken: string,
        price: string,
        interestRateMode: string
    ) => {
        if (!MOCK_MODE) {
            throw new Error('Mock mode not enabled')
        }

        setIsLoading(true)
        try {
            const result = await mockContracts.piv.placeOrder(
                collateralToken,
                collateralAmount,
                debtToken,
                price,
                interestRateMode
            )
            return result
        } finally {
            setIsLoading(false)
        }
    }

    const migrateFromAave = async (
        collateralToken: string,
        collateralAmount: string,
        debtToken: string,
        debtAmount: string,
        interestRateMode: string
    ) => {
        if (!MOCK_MODE) {
            throw new Error('Mock mode not enabled')
        }

        setIsLoading(true)
        try {
            const result = await mockContracts.piv.migrateFromAave(
                collateralToken,
                collateralAmount,
                debtToken,
                debtAmount,
                interestRateMode
            )
            return result
        } finally {
            setIsLoading(false)
        }
    }

    const cancelOrder = async (orderId: string) => {
        if (!MOCK_MODE) {
            throw new Error('Mock mode not enabled')
        }

        setIsLoading(true)
        try {
            const result = await mockContracts.piv.cancelOrder(orderId)
            return result
        } finally {
            setIsLoading(false)
        }
    }

    return {
        getTotalOrders,
        placeOrder,
        migrateFromAave,
        cancelOrder,
        isLoading
    }
}

// Mock API hook
export function useMockApi() {
    const [isLoading, setIsLoading] = useState(false)

    const api = {
        getOrders: async () => {
            if (!MOCK_MODE) return []
            setIsLoading(true)
            try {
                return await mockApi.getOrders()
            } finally {
                setIsLoading(false)
            }
        },

        createOrder: async (orderData: any) => {
            if (!MOCK_MODE) {
                throw new Error('Mock mode not enabled')
            }
            setIsLoading(true)
            try {
                return await mockApi.createOrder(orderData)
            } finally {
                setIsLoading(false)
            }
        },

        fillOrder: async (fillData: any) => {
            if (!MOCK_MODE) {
                throw new Error('Mock mode not enabled')
            }
            setIsLoading(true)
            try {
                return await mockApi.fillOrder(fillData)
            } finally {
                setIsLoading(false)
            }
        },

        syncOrders: async () => {
            if (!MOCK_MODE) return { message: 'Mock not enabled' }
            setIsLoading(true)
            try {
                return await mockApi.syncOrders()
            } finally {
                setIsLoading(false)
            }
        },

        getSyncStatus: async () => {
            if (!MOCK_MODE) return { isRunning: false, pivAddress: '', contractInitialized: false }
            return await mockApi.getSyncStatus()
        }
    }

    return { api, isLoading }
}

// Mock wallet hook
export function useMockWallet() {
    const [isConnected, setIsConnected] = useState(false)
    const [address, setAddress] = useState<string | null>(null)

    useEffect(() => {
        if (MOCK_MODE) {
            setupMockEnvironment()
            setIsConnected(mockUtils.isWalletConnected())
            setAddress(mockUtils.getUserAddress())
        }
    }, [])

    const connect = async () => {
        if (!MOCK_MODE) return null

        const accounts = await mockApi.getOrders() // Trigger connection
        if (accounts) {
            setIsConnected(true)
            setAddress(mockUtils.getUserAddress())
            return mockUtils.getUserAddress()
        }
        return null
    }

    const disconnect = () => {
        if (MOCK_MODE) {
            mockUtils.setWalletConnected(false)
            setIsConnected(false)
            setAddress(null)
        }
    }

    return {
        isConnected,
        address,
        connect,
        disconnect,
        isMockMode: MOCK_MODE
    }
}

// Test scenarios
export const testScenarios = {
    // Scenario 1: Successful swap
    successfulSwap: {
        name: 'Successful Swap',
        description: 'Test a successful token swap with sufficient liquidity',
        setup: () => {
            mockUtils.resetMockData()
            mockUtils.addMockOrder({
                collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                collateralAmount: '2000000000000000000', // 2 WETH
                price: '2000000000', // 2000 USDC per WETH
            })
        }
    },

    // Scenario 2: Insufficient liquidity
    insufficientLiquidity: {
        name: 'Insufficient Liquidity',
        description: 'Test swap with insufficient order book liquidity',
        setup: () => {
            mockUtils.resetMockData()
            // Only add a small order
            mockUtils.addMockOrder({
                collateralAmount: '100000000', // Only 100 USDC
                price: '2000000000000000000',
            })
        }
    },

    // Scenario 3: Migration from Aave
    aaveMigration: {
        name: 'Aave Migration',
        description: 'Test migrating position from Aave to PIV',
        setup: () => {
            mockUtils.resetMockData()
            mockUtils.setWalletConnected(true)
        }
    },

    // Scenario 4: Place multiple orders
    multipleOrders: {
        name: 'Multiple Orders',
        description: 'Test placing multiple orders with different parameters',
        setup: () => {
            mockUtils.resetMockData()
            mockUtils.setWalletConnected(true)
        }
    }
}

// Test runner
export class TestRunner {
    private results: Array<{ scenario: string; success: boolean; error?: string; duration: number }> = []

    async runScenario(scenarioKey: keyof typeof testScenarios, testFunction: () => Promise<void>) {
        const scenario = testScenarios[scenarioKey]
        console.log(`🧪 Running test: ${scenario.name}`)

        const startTime = Date.now()
        try {
            // Setup scenario
            scenario.setup()

            // Run test
            await testFunction()

            const duration = Date.now() - startTime
            this.results.push({ scenario: scenario.name, success: true, duration })
            console.log(`✅ ${scenario.name} passed (${duration}ms)`)
        } catch (error) {
            const duration = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            this.results.push({ scenario: scenario.name, success: false, error: errorMessage, duration })
            console.error(`❌ ${scenario.name} failed: ${errorMessage} (${duration}ms)`)
        }
    }

    async runAllScenarios() {
        console.log('🚀 Starting mock tests...')

        // Test swap functionality
        await this.runScenario('successfulSwap', async () => {
            const result = await mockApi.fillOrder({
                tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amountIn: '1000000000',
                minAmountOut: '900000000000000000'
            })

            if (!result.matchDetails || result.matchDetails.length === 0) {
                throw new Error('No match details returned')
            }
        })

        // Test migration
        await this.runScenario('aaveMigration', async () => {
            const result = await mockContracts.piv.migrateFromAave(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                '1000000000', // 1000 USDC
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                '500000000000000000', // 0.5 WETH debt
                '1'
            )

            const receipt = await result.wait()
            if (!receipt.transactionHash) {
                throw new Error('No transaction hash returned')
            }
        })

        // Test place order
        await this.runScenario('multipleOrders', async () => {
            // Place first order
            const result1 = await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            // Place second order
            const result2 = await mockContracts.piv.placeOrder(
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '1000000000000000000',
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '2000000000',
                '1'
            )

            const receipt1 = await result1.wait()
            const receipt2 = await result2.wait()

            if (!receipt1.transactionHash || !receipt2.transactionHash) {
                throw new Error('Orders were not placed successfully')
            }
        })

        this.printResults()
    }

    printResults() {
        console.log('\n📊 Test Results:')
        console.log('================')

        const passed = this.results.filter(r => r.success).length
        const failed = this.results.filter(r => !r.success).length
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

        this.results.forEach(result => {
            const status = result.success ? '✅' : '❌'
            const error = result.error ? ` - ${result.error}` : ''
            console.log(`${status} ${result.scenario} (${result.duration}ms)${error}`)
        })

        console.log(`\nSummary: ${passed} passed, ${failed} failed, ${totalDuration}ms total`)
    }

    getResults() {
        return this.results
    }
}

export { MOCK_MODE }
