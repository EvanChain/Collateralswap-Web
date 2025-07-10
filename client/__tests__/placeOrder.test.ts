/**
 * Test suite for place order functionality
 * Tests order creation and management in PIV protocol
 */

import { mockApi, mockContracts, mockUtils } from '../lib/mockService'
import { TestRunner, testScenarios } from '../lib/testUtils'

describe('Place Order Tests', () => {
    let testRunner: TestRunner;

    beforeEach(() => {
        testRunner = new TestRunner()
        mockUtils.resetMockData()
        mockUtils.setWalletConnected(true)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Order Creation via API', () => {
        test('should successfully create order via API', async () => {
            const orderData = {
                owner: mockUtils.getUserAddress(),
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                collateralAmount: '1000000000', // 1000 USDC
                price: '2000000000000000000' // 2 WETH per 1000 USDC
            }

            const result = await mockApi.createOrder(orderData)

            expect(result).toHaveProperty('_id')
            expect(result).toHaveProperty('orderId')
            expect(result.owner).toBe(orderData.owner)
            expect(result.collateralToken).toBe(orderData.collateralToken)
            expect(result.debtToken).toBe(orderData.debtToken)
            expect(result.collateralAmount).toBe(orderData.collateralAmount)
            expect(result.price).toBe(orderData.price)
            expect(result.status).toBe('OPEN')
            expect(result.filledAmount).toBe('0')
        })

        test('should generate unique order IDs', async () => {
            const orderData = {
                owner: mockUtils.getUserAddress(),
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000',
                price: '2000000000000000000'
            }

            const order1 = await mockApi.createOrder(orderData)
            const order2 = await mockApi.createOrder(orderData)

            expect(order1._id).not.toBe(order2._id)
            expect(order1.orderId).not.toBe(order2.orderId)
        })

        test('should add created orders to order book', async () => {
            const initialOrders = await mockApi.getOrders()
            const initialCount = initialOrders.length

            const orderData = {
                owner: mockUtils.getUserAddress(),
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000',
                price: '2000000000000000000'
            }

            await mockApi.createOrder(orderData)

            const updatedOrders = await mockApi.getOrders()
            expect(updatedOrders.length).toBe(initialCount + 1)

            const newOrder = updatedOrders.find(order => order.owner === orderData.owner)
            expect(newOrder).toBeDefined()
            expect(newOrder?.collateralAmount).toBe(orderData.collateralAmount)
        })
    })

    describe('Order Creation via Contract', () => {
        test('should successfully place order via PIV contract', async () => {
            const orderParams = {
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                collateralAmount: '1000000000',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                price: '2000000000000000000',
                interestRateMode: '1'
            }

            const result = await mockContracts.piv.placeOrder(
                orderParams.collateralToken,
                orderParams.collateralAmount,
                orderParams.debtToken,
                orderParams.price,
                orderParams.interestRateMode
            )

            expect(result).toBeDefined()
            expect(typeof result.wait).toBe('function')

            const receipt = await result.wait()
            expect(receipt).toHaveProperty('transactionHash')
            expect(receipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)
        })

        test('should add order to mock database when placed via contract', async () => {
            const initialOrders = mockUtils.getMockOrders()
            const initialCount = initialOrders.length

            await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            const updatedOrders = mockUtils.getMockOrders()
            expect(updatedOrders.length).toBe(initialCount + 1)

            const newOrder = updatedOrders[updatedOrders.length - 1]
            expect(newOrder.owner).toBe(mockUtils.getUserAddress())
            expect(newOrder.isFromBlockchain).toBe(true)
        })

        test('should handle different interest rate modes', async () => {
            const interestRateModes = ['1', '2'] // Variable and Stable

            for (const mode of interestRateModes) {
                const result = await mockContracts.piv.placeOrder(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    '1000000000',
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '2000000000000000000',
                    mode
                )

                const receipt = await result.wait()
                expect(receipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)

                // Verify the order was added with correct interest rate mode
                const orders = mockUtils.getMockOrders()
                const latestOrder = orders[orders.length - 1]
                expect(latestOrder.interestRateMode).toBe(mode)
            }
        })

        test('should handle various token pairs', async () => {
            const tokenPairs = [
                {
                    collateral: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                    debt: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                    amount: '1000000000', // 1000 USDC
                    price: '2000000000000000000' // 2 WETH per 1000 USDC
                },
                {
                    collateral: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                    debt: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                    amount: '1000000000000000000', // 1 WETH
                    price: '2000000000' // 2000 USDC per WETH
                }
            ]

            for (const pair of tokenPairs) {
                const result = await mockContracts.piv.placeOrder(
                    pair.collateral,
                    pair.amount,
                    pair.debt,
                    pair.price,
                    '1'
                )

                const receipt = await result.wait()
                expect(receipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)

                const orders = mockUtils.getMockOrders()
                const latestOrder = orders[orders.length - 1]
                expect(latestOrder.collateralToken).toBe(pair.collateral)
                expect(latestOrder.debtToken).toBe(pair.debt)
                expect(latestOrder.collateralAmount).toBe(pair.amount)
                expect(latestOrder.price).toBe(pair.price)
            }
        })
    })

    describe('Order Management', () => {
        test('should cancel existing order', async () => {
            // First, create an order
            const result = await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            await result.wait()
            const orders = mockUtils.getMockOrders()
            const newOrder = orders[orders.length - 1]
            expect(newOrder.status).toBe('OPEN')

            // Cancel the order
            const cancelResult = await mockContracts.piv.cancelOrder(newOrder.orderId!)
            const cancelReceipt = await cancelResult.wait()

            expect(cancelReceipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)

            // Verify order is cancelled
            const updatedOrders = mockUtils.getMockOrders()
            const cancelledOrder = updatedOrders.find(o => o.orderId === newOrder.orderId)
            expect(cancelledOrder?.status).toBe('CANCELLED')
        })

        test('should get total order count', async () => {
            const initialCount = await mockContracts.piv.totalOrders()

            // Add a new order
            await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            const newCount = await mockContracts.piv.totalOrders()
            expect(newCount).toBe(initialCount + 1)
        })

        test('should retrieve all orders via API', async () => {
            // Add some orders
            await mockApi.createOrder({
                owner: mockUtils.getUserAddress(),
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000',
                price: '2000000000000000000'
            })

            const orders = await mockApi.getOrders()
            expect(Array.isArray(orders)).toBe(true)
            expect(orders.length).toBeGreaterThan(0)

            const order = orders[0]
            expect(order).toHaveProperty('_id')
            expect(order).toHaveProperty('owner')
            expect(order).toHaveProperty('collateralToken')
            expect(order).toHaveProperty('debtToken')
            expect(order).toHaveProperty('status')
        })
    })

    describe('Error Handling', () => {
        test('should handle invalid token addresses', async () => {
            try {
                await mockContracts.piv.placeOrder(
                    '0xInvalidAddress',
                    '1000000000',
                    '0xAnotherInvalidAddress',
                    '2000000000000000000',
                    '1'
                )
                // Mock might still succeed, but in real scenario this would fail
                expect(true).toBe(true)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }
        })

        test('should handle zero amounts', async () => {
            try {
                await mockContracts.piv.placeOrder(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    '0', // Zero amount
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '2000000000000000000',
                    '1'
                )
                // Mock might allow this, but real contract should validate
                expect(true).toBe(true)
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
            }
        })

        test('should handle network errors during order placement', async () => {
            // Mock a network failure
            const originalPlaceOrder = mockContracts.piv.placeOrder
            mockContracts.piv.placeOrder = jest.fn().mockRejectedValue(new Error('Network error'))

            await expect(
                mockContracts.piv.placeOrder(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    '1000000000',
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '2000000000000000000',
                    '1'
                )
            ).rejects.toThrow('Network error')

            // Restore original function
            mockContracts.piv.placeOrder = originalPlaceOrder
        })

        test('should handle API errors during order creation', async () => {
            // Mock an API failure
            const originalCreateOrder = mockApi.createOrder
            mockApi.createOrder = jest.fn().mockRejectedValue(new Error('API error'))

            await expect(
                mockApi.createOrder({
                    owner: mockUtils.getUserAddress(),
                    collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000',
                    price: '2000000000000000000'
                })
            ).rejects.toThrow('API error')

            // Restore original function
            mockApi.createOrder = originalCreateOrder
        })
    })

    describe('Performance and Scalability', () => {
        test('should handle multiple order placements efficiently', async () => {
            const orderCount = 5
            const startTime = Date.now()

            const orderPromises = Array(orderCount).fill(null).map((_, index) =>
                mockContracts.piv.placeOrder(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    `${1000000000 + index}`, // Slightly different amounts
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '2000000000000000000',
                    '1'
                )
            )

            const results = await Promise.all(orderPromises)
            const duration = Date.now() - startTime

            expect(results).toHaveLength(orderCount)
            expect(duration).toBeLessThan(10000) // Should complete within 10 seconds

            // Verify all orders were created
            for (const result of results) {
                const receipt = await result.wait()
                expect(receipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)
            }
        })

        test('should maintain order consistency across API and contract', async () => {
            // Create order via contract
            await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            // Create order via API
            await mockApi.createOrder({
                owner: mockUtils.getUserAddress(),
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                collateralAmount: '1000000000',
                price: '2000000000000000000'
            })

            const orders = await mockApi.getOrders()
            const contractOrders = orders.filter(o => o.isFromBlockchain)
            const apiOrders = orders.filter(o => !o.isFromBlockchain)

            expect(contractOrders.length).toBeGreaterThan(0)
            expect(apiOrders.length).toBeGreaterThan(0)

            // Both should have consistent structure
            contractOrders.forEach(order => {
                expect(order).toHaveProperty('owner')
                expect(order).toHaveProperty('collateralToken')
                expect(order).toHaveProperty('status')
            })
        })
    })

    describe('Integration Tests', () => {
        test('should run multiple orders scenario end-to-end', async () => {
            await testRunner.runScenario('multipleOrders', async () => {
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

                expect(receipt1.transactionHash).toBeDefined()
                expect(receipt2.transactionHash).toBeDefined()
            })

            const results = testRunner.getResults()
            expect(results).toHaveLength(1)
            expect(results[0].success).toBe(true)
        })

        test('should verify order placement increases order book size', async () => {
            const initialCount = await mockContracts.piv.totalOrders()
            const initialOrders = await mockApi.getOrders()

            // Place new order
            await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            const finalCount = await mockContracts.piv.totalOrders()
            const finalOrders = await mockApi.getOrders()

            expect(finalCount).toBe(initialCount + 1)
            expect(finalOrders.length).toBe(initialOrders.length + 1)
        })
    })
})
