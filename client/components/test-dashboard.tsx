// Test dashboard component for running mock tests
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
    TestRunner,
    testScenarios,
    useMockApi,
    useMockPivOrderBook,
    useMockIRouter,
    useMockWallet,
    MOCK_MODE
} from '../lib/testUtils'
import { mockUtils } from '../lib/mockService'
import { Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'

export function TestDashboard() {
    const [testResults, setTestResults] = useState<any[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [selectedScenario, setSelectedScenario] = useState<string>('')

    const { api: mockApi, isLoading: apiLoading } = useMockApi()
    const { placeOrder, migrateFromAave, isLoading: contractLoading } = useMockPivOrderBook()
    const { swapWithRouter, isLoading: routerLoading } = useMockIRouter()
    const { isConnected, address, connect, isMockMode } = useMockWallet()

    useEffect(() => {
        if (!isMockMode) {
            console.warn('Mock mode is not enabled. Set NEXT_PUBLIC_MOCK_MODE=true to enable testing.')
        }
    }, [isMockMode])

    const runAllTests = async () => {
        if (!MOCK_MODE) {
            alert('Mock mode is not enabled. Cannot run tests.')
            return
        }

        setIsRunning(true)
        setTestResults([])

        try {
            const runner = new TestRunner()
            await runner.runAllScenarios()
            setTestResults(runner.getResults())
        } catch (error) {
            console.error('Test runner failed:', error)
        } finally {
            setIsRunning(false)
        }
    }

    const runSingleTest = async (scenarioKey: string) => {
        if (!MOCK_MODE) return

        setIsRunning(true)
        const scenario = testScenarios[scenarioKey as keyof typeof testScenarios]

        try {
            scenario.setup()

            switch (scenarioKey) {
                case 'successfulSwap':
                    await testSwapFunction()
                    break
                case 'aaveMigration':
                    await testMigrationFunction()
                    break
                case 'multipleOrders':
                    await testPlaceOrderFunction()
                    break
            }

            alert(`✅ Test "${scenario.name}" passed!`)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            alert(`❌ Test "${scenario.name}" failed: ${message}`)
        } finally {
            setIsRunning(false)
        }
    }

    const testSwapFunction = async () => {
        const result = await mockApi.fillOrder({
            tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            amountIn: '1000000000',
            minAmountOut: '900000000000000000'
        })

        if (!result.matchDetails || result.matchDetails.length === 0) {
            throw new Error('No matches found in swap test')
        }

        // Test router swap
        const swapData = {
            tokenIn: '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            amountIn: '1000000000',
            minAmountOut: '900000000000000000',
            orderDatas: [{
                pivAddress: '0x1234567890123456789012345678901234567890',
                orderIds: result.matchDetails.map(m => m.orderId)
            }]
        }

        const routerResult = await swapWithRouter(swapData)
        console.log('Router swap result:', routerResult)
    }

    const testMigrationFunction = async () => {
        const result = await migrateFromAave(
            '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2', // USDC
            '1000000000', // 1000 USDC
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            '500000000000000000', // 0.5 WETH debt
            '1'
        )

        const receipt = await result.wait()
        console.log('Migration result:', receipt)
    }

    const testPlaceOrderFunction = async () => {
        const result = await placeOrder(
            '0xA0b86a33E6441A3063BdFb663c6C8FAc6C8A4Ec2',
            '1000000000',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            '2000000000000000000',
            '1'
        )

        const receipt = await result.wait()
        console.log('Place order result:', receipt)
    }

    const resetMockData = () => {
        mockUtils.resetMockData()
        alert('Mock data has been reset')
    }

    if (!MOCK_MODE) {
        return (
            <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                    <CardTitle className="text-yellow-800">Mock Mode Disabled</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-yellow-700">
                        To enable testing, set <code>NEXT_PUBLIC_MOCK_MODE=true</code> in your environment variables.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        🧪 CollateralSwap Mock Testing Dashboard
                        {MOCK_MODE && <Badge variant="secondary">Mock Mode</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            onClick={runAllTests}
                            disabled={isRunning}
                            className="flex items-center gap-2"
                        >
                            <Play className="h-4 w-4" />
                            {isRunning ? 'Running Tests...' : 'Run All Tests'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={resetMockData}
                            className="flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset Mock Data
                        </Button>

                        <div className="text-sm text-gray-600">
                            Wallet: {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not Connected'}
                        </div>
                    </div>

                    <Tabs defaultValue="scenarios" className="w-full">
                        <TabsList>
                            <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
                            <TabsTrigger value="results">Test Results</TabsTrigger>
                            <TabsTrigger value="interactive">Interactive Tests</TabsTrigger>
                        </TabsList>

                        <TabsContent value="scenarios" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(testScenarios).map(([key, scenario]) => (
                                    <Card key={key} className="border">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">{scenario.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                                            <Button
                                                size="sm"
                                                onClick={() => runSingleTest(key)}
                                                disabled={isRunning}
                                                className="w-full"
                                            >
                                                {isRunning ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                                Run Test
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="results" className="space-y-4">
                            {testResults.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No test results yet. Run some tests to see results here.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {testResults.map((result, index) => (
                                        <Card key={index} className={`border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {result.success ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                        )}
                                                        <span className="font-medium">{result.scenario}</span>
                                                    </div>
                                                    <Badge variant={result.success ? "default" : "destructive"}>
                                                        {result.duration}ms
                                                    </Badge>
                                                </div>
                                                {result.error && (
                                                    <p className="text-sm text-red-600 mt-2">{result.error}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="interactive" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Swap Test</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => testSwapFunction().catch(e => alert('Swap failed: ' + e.message))}
                                            disabled={apiLoading || routerLoading}
                                            className="w-full"
                                        >
                                            Test Swap Function
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Migration Test</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => testMigrationFunction().catch(e => alert('Migration failed: ' + e.message))}
                                            disabled={contractLoading}
                                            className="w-full"
                                        >
                                            Test Aave Migration
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Place Order Test</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => testPlaceOrderFunction().catch(e => alert('Place order failed: ' + e.message))}
                                            disabled={contractLoading}
                                            className="w-full"
                                        >
                                            Test Place Order
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Mock Data Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div>Orders in mock database: {mockUtils.getMockOrders().length}</div>
                                        <div>Wallet connected: {isConnected ? 'Yes' : 'No'}</div>
                                        <div>User address: {address || 'Not set'}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
