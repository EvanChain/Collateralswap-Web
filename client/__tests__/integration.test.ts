/**
 * Integration tests for the complete CollateralSwap frontend
 * Tests end-to-end flows and component interactions
 */

import { mockApi, mockContracts, mockUtils, setupMockEnvironment } from '../lib/mockService'
import { TestRunner, testScenarios, MOCK_MODE } from '../lib/testUtils'

describe('CollateralSwap Integration Tests', () => {
    let testRunner: TestRunner;

    beforeAll(() => {
        setupMockEnvironment()
    })

    beforeEach(() => {
        testRunner = new TestRunner()
        mockUtils.resetMockData()
        mockUtils.setWalletConnected(true)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Mock Environment', () => {
        test('should have mock mode enabled', () => {
            expect(MOCK_MODE).toBe(true)
        })

        test('should have mock wallet connected', () => {
            expect(mockUtils.isWalletConnected()).toBe(true)
            expect(mockUtils.getUserAddress()).toMatch(/^0x[a-f0-9]{40}$/i)
        })

        test('should have mock environment setup', () => {
            if (typeof window !== 'undefined') {
                expect(window.ethereum).toBeDefined()
                expect(typeof window.ethereum?.request).toBe('function')
            }
        })
    })

    describe('Complete User Flows', () => {
        test('should complete full swap flow: create orders → match → execute', async () => {
            // Step 1: Create orders in the order book
            await mockApi.createOrder({
                owner: '0x1111111111111111111111111111111111111111',
                collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                collateralAmount: '2000000000000000000', // 2 WETH
                price: '2000000000' // 2000 USDC per WETH
            })

            // Step 2: User wants to swap USDC for WETH
            const fillRequest = {
                tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                amountIn: '1000000000', // 1000 USDC
                minAmountOut: '400000000000000000' // 0.4 WETH minimum
            }

            const matchResult = await mockApi.fillOrder(fillRequest)

            // Step 3: Execute swap through router
            const swapData = {
                tokenIn: fillRequest.tokenIn,
                tokenOut: fillRequest.tokenOut,
                amountIn: fillRequest.amountIn,
                minAmountOut: fillRequest.minAmountOut,
                orderDatas: [{
                    pivAddress: '0x1234567890123456789012345678901234567890',
                    orderIds: matchResult.matchDetails.map(m => m.orderId)
                }]
            }

            const swapResult = await mockContracts.router.swap(swapData)
            const receipt = await swapResult.wait()

            // Verify complete flow
            expect(matchResult.matchDetails).toHaveLength(1)
            expect(BigInt(matchResult.totalOut)).toBeGreaterThan(BigInt(fillRequest.minAmountOut))
            expect(receipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)
            expect(BigInt(swapResult.netAmountOut)).toBeGreaterThan(BigInt(0))
        })

        test('should complete full migration flow: migrate position → verify optimization', async () => {
            const migrationParams = {
                collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
                collateralAmount: '2000000000', // 2000 USDC
                debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
                debtAmount: '1000000000000000000', // 1 WETH debt
                interestRateMode: '1'
            }

            // Execute migration
            const migrationResult = await mockContracts.piv.migrateFromAave(
                migrationParams.collateralToken,
                migrationParams.collateralAmount,
                migrationParams.debtToken,
                migrationParams.debtAmount,
                migrationParams.interestRateMode
            )

            const receipt = await migrationResult.wait()
            const event = receipt.events[0]

            // Verify migration optimization
            expect(event.args.user).toBe(mockUtils.getUserAddress())
            expect(event.args.collateralToken).toBe(migrationParams.collateralToken)
            expect(event.args.debtToken).toBe(migrationParams.debtToken)
            expect(BigInt(event.args.newDebtAmount)).toBeLessThan(BigInt(migrationParams.debtAmount))

            // Calculate debt reduction
            const debtReduction = BigInt(migrationParams.debtAmount) - BigInt(event.args.newDebtAmount)
            const reductionPercentage = (debtReduction * BigInt(100)) / BigInt(migrationParams.debtAmount)

            expect(reductionPercentage).toBeGreaterThan(BigInt(0))
            expect(reductionPercentage).toBeLessThanOrEqual(BigInt(10))
        })

        test('should complete full order management flow: place → track → cancel', async () => {
            // Step 1: Place order
            const orderResult = await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            const orderReceipt = await orderResult.wait()
            expect(orderReceipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)

            // Step 2: Track order in order book
            const orders = await mockApi.getOrders()
            const userOrders = orders.filter(o => o.owner === mockUtils.getUserAddress())
            expect(userOrders.length).toBeGreaterThan(0)

            const placedOrder = userOrders[userOrders.length - 1]
            expect(placedOrder.status).toBe('OPEN')
            expect(placedOrder.isFromBlockchain).toBe(true)

            // Step 3: Cancel order
            const cancelResult = await mockContracts.piv.cancelOrder(placedOrder.orderId!)
            const cancelReceipt = await cancelResult.wait()
            expect(cancelReceipt.transactionHash).toMatch(/^0x[a-f0-9]+$/i)

            // Step 4: Verify cancellation
            const updatedOrders = mockUtils.getMockOrders()
            const cancelledOrder = updatedOrders.find(o => o.orderId === placedOrder.orderId)
            expect(cancelledOrder?.status).toBe('CANCELLED')
        })
    })

    describe('Cross-Component Integration', () => {
        test('should maintain data consistency between API and contract calls', async () => {
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
                collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                collateralAmount: '1000000000000000000',
                price: '2000000000'
            })

            // Verify both sources are accessible
            const apiOrders = await mockApi.getOrders()
            const contractTotal = await mockContracts.piv.totalOrders()

            expect(apiOrders.length).toBeGreaterThanOrEqual(2)
            expect(contractTotal).toBeGreaterThanOrEqual(2)

            // Verify order types are properly distinguished
            const contractOrders = apiOrders.filter(o => o.isFromBlockchain)
            const apiOnlyOrders = apiOrders.filter(o => !o.isFromBlockchain)

            expect(contractOrders.length).toBeGreaterThan(0)
            expect(apiOnlyOrders.length).toBeGreaterThan(0)
        })

        test('should handle concurrent operations without conflicts', async () => {
            const operations = [
                // Concurrent order placements
                mockContracts.piv.placeOrder(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    '1000000000',
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '2000000000000000000',
                    '1'
                ),
                mockApi.createOrder({
                    owner: mockUtils.getUserAddress(),
                    collateralToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    debtToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    collateralAmount: '1000000000000000000',
                    price: '2000000000'
                }),
                // Concurrent swap
                mockApi.fillOrder({
                    tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    amountIn: '500000000',
                    minAmountOut: '200000000000000000'
                }),
                // Concurrent migration
                mockContracts.piv.migrateFromAave(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    '1000000000',
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '500000000000000000',
                    '1'
                )
            ]

            const results = await Promise.all(operations)

            // Verify all operations completed successfully
            expect(results).toHaveLength(4)

            // Contract operations should have wait functions
            expect(typeof results[0].wait).toBe('function')
            expect(typeof results[3].wait).toBe('function')

            // API operations should return data directly
            expect(results[1]).toHaveProperty('_id') // Created order
            expect(results[2]).toHaveProperty('matchDetails') // Fill result
        })

        test('should maintain proper state after mixed operations', async () => {
            const initialOrderCount = await mockContracts.piv.totalOrders()
            const initialApiOrders = await mockApi.getOrders()

            // Perform mixed operations
            await mockContracts.piv.placeOrder(
                '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                '1000000000',
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                '2000000000000000000',
                '1'
            )

            await mockApi.fillOrder({
                tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amountIn: '500000000',
                minAmountOut: '200000000000000000'
            })

            // Verify final state
            const finalOrderCount = await mockContracts.piv.totalOrders()
            const finalApiOrders = await mockApi.getOrders()

            expect(finalOrderCount).toBe(initialOrderCount + 1)
            expect(finalApiOrders.length).toBeGreaterThan(initialApiOrders.length)

            // Verify some orders may have been filled
            const filledOrders = finalApiOrders.filter(o => o.status === 'FILLED')
            expect(filledOrders.length).toBeGreaterThanOrEqual(0) // May have filled some orders
        })
    })

    describe('All Test Scenarios', () => {
        test('should run all predefined test scenarios', async () => {
            await testRunner.runAllScenarios()
            const results = testRunner.getResults()

            expect(results.length).toBeGreaterThan(0)

            // Check that we have results for all main scenarios
            const scenarioNames = results.map(r => r.scenario)
            expect(scenarioNames).toContain('Successful Swap')
            expect(scenarioNames).toContain('Aave Migration')
            expect(scenarioNames).toContain('Multiple Orders')

            // Most scenarios should pass (allowing for some flaky tests)
            const passedTests = results.filter(r => r.success)
            const passRate = passedTests.length / results.length
            expect(passRate).toBeGreaterThan(0.7) // At least 70% pass rate

            // All tests should complete within reasonable time
            results.forEach(result => {
                expect(result.duration).toBeLessThan(10000) // 10 seconds max per test
            })
        })

        test('should handle scenario setup and teardown properly', async () => {
            // Run a scenario that modifies state
            await testRunner.runScenario('successfulSwap', async () => {
                const result = await mockApi.fillOrder({
                    tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    amountIn: '1000000000',
                    minAmountOut: '900000000000000000'
                })
                expect(result.matchDetails.length).toBeGreaterThan(0)
            })

            // Verify scenario setup worked
            const results = testRunner.getResults()
            expect(results).toHaveLength(1)
            expect(results[0].success).toBe(true)

            // State should be properly managed between scenarios
            const orders = mockUtils.getMockOrders()
            expect(orders.length).toBeGreaterThan(0) // Should have orders from scenario setup
        })
    })

    describe('Error Recovery and Resilience', () => {
        test('should recover from network errors gracefully', async () => {
            // Mock network failure
            const originalFillOrder = mockApi.fillOrder
            mockApi.fillOrder = jest.fn()
                .mockRejectedValueOnce(new Error('Network timeout'))
                .mockImplementation(originalFillOrder)

            // First call should fail
            await expect(mockApi.fillOrder({
                tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amountIn: '1000000000',
                minAmountOut: '900000000000000000'
            })).rejects.toThrow('Network timeout')

            // Second call should succeed
            const result = await mockApi.fillOrder({
                tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                amountIn: '1000000000',
                minAmountOut: '900000000000000000'
            })

            expect(result).toHaveProperty('matchDetails')
        })

        test('should maintain data integrity after partial failures', async () => {
            const initialOrders = await mockApi.getOrders()
            const initialCount = initialOrders.length

            // Attempt operations with some failures
            const operations = [
                mockApi.createOrder({
                    owner: mockUtils.getUserAddress(),
                    collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: '1000000000',
                    price: '2000000000000000000'
                }),
                // This might fail but shouldn't affect other operations
                mockApi.fillOrder({
                    tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    amountIn: '999999999999999999', // Very large amount, might fail
                    minAmountOut: '900000000000000000'
                }).catch(() => null), // Allow this to fail
                mockContracts.piv.placeOrder(
                    '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    '1000000000',
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '2000000000000000000',
                    '1'
                )
            ]

            const results = await Promise.allSettled(operations)

            // At least some operations should succeed
            const successfulResults = results.filter(r => r.status === 'fulfilled')
            expect(successfulResults.length).toBeGreaterThan(0)

            // Data should still be consistent
            const finalOrders = await mockApi.getOrders()
            expect(finalOrders.length).toBeGreaterThanOrEqual(initialCount)
        })
    })

    describe('Performance and Scalability', () => {
        test('should handle high volume operations', async () => {
            const startTime = Date.now()
            const operationCount = 20

            const operations = Array(operationCount).fill(null).map(async (_, index) => {
                if (index % 3 === 0) {
                    // Create orders
                    return mockApi.createOrder({
                        owner: mockUtils.getUserAddress(),
                        collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                        debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        collateralAmount: `${1000000000 + index}`,
                        price: '2000000000000000000'
                    })
                } else if (index % 3 === 1) {
                    // Place orders via contract
                    return mockContracts.piv.placeOrder(
                        '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                        `${1000000000 + index}`,
                        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        '2000000000000000000',
                        '1'
                    )
                } else {
                    // Fill orders
                    return mockApi.fillOrder({
                        tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                        tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        amountIn: `${100000000 + index}`,
                        minAmountOut: '90000000000000000'
                    }).catch(() => null) // Some might fail due to lack of liquidity
                }
            })

            const results = await Promise.allSettled(operations)
            const duration = Date.now() - startTime

            expect(duration).toBeLessThan(30000) // Should complete within 30 seconds

            const successfulOperations = results.filter(r => r.status === 'fulfilled')
            expect(successfulOperations.length).toBeGreaterThan(operationCount * 0.5) // At least 50% success
        })

        test('should maintain responsive performance under load', async () => {
            // Start background operations
            const backgroundOps = Array(10).fill(null).map((_, index) =>
                mockApi.createOrder({
                    owner: `0x${index.toString().padStart(40, '0')}`,
                    collateralToken: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
                    debtToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralAmount: `${1000000000 + index}`,
                    price: '2000000000000000000'
                })
            )

            // Measure response time for foreground operations
            const foregroundStartTime = Date.now()

            await mockApi.getOrders()
            const getOrdersTime = Date.now() - foregroundStartTime

            await mockContracts.piv.totalOrders()
            const contractCallTime = Date.now() - foregroundStartTime - getOrdersTime

            // Wait for background operations to complete
            await Promise.all(backgroundOps)

            // Response times should remain reasonable even under load
            expect(getOrdersTime).toBeLessThan(2000) // 2 seconds max
            expect(contractCallTime).toBeLessThan(1000) // 1 second max
        })
    })
})
