"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePivOrderBook } from "@/hooks/usePivOrderBook"
import { useAntdWallet } from "@/hooks/useAntdWallet"
import { useWallet } from "@/hooks/useWallet"
import { orderApi, type Order } from "../lib/api"
import { AaveUtils, getAaveUtils, createSampleAavePositions, type AavePosition } from "../lib/aaveUtils"
import { mockAavePositions, useMockAavePositions } from "../lib/mockAaveData"
import { testAaveConnection } from "../lib/testAave"
import { migrationService, type MigrationRequest } from "../lib/migrationService"
import { getPivUtils } from "../lib/mockPivUtils"
import { mockDataStore, PivPosition } from "../lib/mockData"

// Mock data for Vault positions
const vaultPositions = [
  {
    id: 1,
    debt: { token: "USDC", amount: 5000 },
    collateral: { token: "WBTC", amount: 1 },
  },
  {
    id: 2,
    debt: { token: "LINK", amount: 300 },
    collateral: { token: "UNI", amount: 50 },
  },
  {
    id: 3,
    debt: { token: "AAVE", amount: 10 },
    collateral: { token: "CRV", amount: 200 },
  },
]

export default function PositionPageContent() {
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false)
  const [currentMigrationPosition, setCurrentMigrationPosition] = useState<any>(null)
  const [migrationType, setMigrationType] = useState<"aaveToVault" | "placeOrder" | null>(null)
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<string>("")
  const [collateralAmountInput, setCollateralAmountInput] = useState<string>("")
  const [selectedDebtToken, setSelectedDebtToken] = useState<string>("")
  const [debtAmountInput, setDebtAmountInput] = useState<string>("")
  const [priceInput, setPriceInput] = useState<string>("")
  const [selectedInterestRateType, setSelectedInterestRateType] = useState<string>("")
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [newPriceInput, setNewPriceInput] = useState<string>("")
  const [aavePositions, setAavePositions] = useState<AavePosition[]>([])
  const [isLoadingAave, setIsLoadingAave] = useState(false)
  const [aaveError, setAaveError] = useState<string | null>(null)
  const [pivPositions, setPivPositions] = useState<PivPosition[]>([])
  const [isLoadingPiv, setIsLoadingPiv] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  // Use antd wallet connection
  const { isConnected, address } = useAntdWallet()
  const { provider } = useWallet() // Get ethers provider for Aave contract calls

  const {
    getTotalOrders,
    getAtokenAddress,
    migrateFromAave,
    placeOrder,
    updateOrder,
    cancelOrder,
    previewSwap,
    swap
  } = usePivOrderBook()

  const handleDialogClose = (open: boolean) => {
    setIsMigrationDialogOpen(open)

    // Clear form fields when dialog is closed
    if (!open) {
      setCurrentMigrationPosition(null)
      setMigrationType(null)
      setSelectedCollateralToken("")
      setCollateralAmountInput("")
      setSelectedDebtToken("")
      setDebtAmountInput("")
      setPriceInput("")
      setSelectedInterestRateType("")
    }
  }

  const openMigrationDialog = (position: any, type: "aaveToVault" | "placeOrder") => {
    setCurrentMigrationPosition(position)
    setMigrationType(type)

    if (type === "aaveToVault" && position.type === 'collateral') {
      // Set collateral defaults
      setSelectedCollateralToken(position.token)
      setCollateralAmountInput(position.formattedAmount)

      // Find a debt position from the same user's AAVE positions to set defaults
      const debtPositions = aavePositions.filter(p => p.type === 'debt')
      if (debtPositions.length > 0) {
        // Smart selection: prefer stablecoins (USDC, USDT, DAI) or largest debt position
        const stablecoinDebts = debtPositions.filter(p =>
          ['USDC', 'USDT', 'DAI'].includes(p.token)
        )

        let defaultDebtPosition
        if (stablecoinDebts.length > 0) {
          // Use the first stablecoin debt position
          defaultDebtPosition = stablecoinDebts[0]
        } else {
          // Use the debt position with the largest amount
          defaultDebtPosition = debtPositions.reduce((prev, current) =>
            parseFloat(current.formattedAmount) > parseFloat(prev.formattedAmount) ? current : prev
          )
        }

        setSelectedDebtToken(defaultDebtPosition.token)
        setDebtAmountInput(defaultDebtPosition.formattedAmount)

        console.log('Auto-selected debt position:', defaultDebtPosition)
      } else {
        // Fallback defaults if no debt positions found
        setSelectedDebtToken("USDC")
        setDebtAmountInput("1000")
      }
    } else if (type === "placeOrder" && position.type === 'collateral') {
      // Set collateral defaults for order creation
      setSelectedCollateralToken(position.token)
      setCollateralAmountInput(position.formattedAmount)
      // Set a default debt token for order creation
      setSelectedDebtToken("USDC")
      setPriceInput("") // User should set price manually
    }

    setSelectedInterestRateType("static")
    setIsMigrationDialogOpen(true)
  }

  const handleConfirmMigration = async () => {
    if (!currentMigrationPosition || !selectedCollateralToken || !collateralAmountInput || !selectedInterestRateType || !address) {
      alert("Please fill all migration details and ensure wallet is connected.")
      return
    }

    // For migration, also validate debt fields
    if (migrationType === "aaveToVault" && (!selectedDebtToken || !debtAmountInput)) {
      alert("Please fill all debt details for migration.")
      return
    }

    // For place order, also validate price
    if (migrationType === "placeOrder" && (!selectedDebtToken || !priceInput)) {
      alert("Please fill debt token and price for order creation.")
      return
    }

    const collateralAmount = Number.parseFloat(collateralAmountInput)
    if (isNaN(collateralAmount) || collateralAmount <= 0) {
      alert("Please enter a valid collateral amount.")
      return
    }

    if (migrationType === "aaveToVault") {
      const debtAmount = Number.parseFloat(debtAmountInput)
      if (isNaN(debtAmount) || debtAmount <= 0) {
        alert("Please enter a valid debt amount.")
        return
      }
    }

    if (migrationType === "placeOrder") {
      const price = Number.parseFloat(priceInput)
      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price.")
        return
      }
    }

    setIsMigrating(true)

    try {
      // Create migration request
      const migrationRequest: MigrationRequest = {
        userAddress: address,
        aavePosition: currentMigrationPosition,
        migrationType: migrationType!,
        collateralToken: selectedCollateralToken,
        collateralAmount: collateralAmountInput,
        debtToken: selectedDebtToken,
        debtAmount: migrationType === "aaveToVault" ? debtAmountInput : undefined,
        price: migrationType === "placeOrder" ? priceInput : undefined,
        interestRateMode: selectedInterestRateType === "static" ? "stable" : "variable"
      }

      console.log('Starting migration with request:', migrationRequest)

      // Execute migration
      const result = await migrationService.migratePosition(migrationRequest)

      if (result.success) {
        console.log('Migration successful:', result)

        // Refresh data
        await Promise.all([
          fetchAavePositions(),
          fetchOrders(),
          fetchPivPositions()
        ])

        // Show success message
        alert(`Migration successful! ${result.order ? 'Order created: ' + result.order.orderId : ''}`)

        setIsMigrationDialogOpen(false)
        setCurrentMigrationPosition(null)
        setMigrationType(null)
        setSelectedCollateralToken("")
        setCollateralAmountInput("")
        setSelectedDebtToken("")
        setDebtAmountInput("")
        setPriceInput("")
        setSelectedInterestRateType("")
      } else {
        console.error('Migration failed:', result.error)
        alert(`Migration failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Migration error:', error)
      alert(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsMigrating(false)
    }
  }

  // Handle order update
  const handleUpdateOrder = async (orderId: string, newPrice: string) => {
    if (!newPrice || isNaN(Number.parseFloat(newPrice)) || Number.parseFloat(newPrice) <= 0) {
      alert("Please enter a valid price.")
      return
    }

    try {
      // Call update order API
      await orderApi.updateOrder(orderId, { price: newPrice })

      // Refresh orders
      await fetchOrders()

      // Reset editing state
      setEditingOrderId(null)
      setNewPriceInput("")

      alert("Order updated successfully!")
    } catch (error) {
      console.error('Error updating order:', error)
      alert(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return
    }

    try {
      // Call cancel order API
      await orderApi.cancelOrder(orderId)

      // Refresh orders
      await fetchOrders()

      alert("Order cancelled successfully!")
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Fetch Aave positions
  const fetchAavePositions = async () => {
    if (!address) return

    setIsLoadingAave(true)
    setAaveError(null)
    try {
      console.log('Fetching Aave positions for address:', address)

      // Use mock data if enabled
      if (useMockAavePositions) {
        console.log('Using mock Aave positions for testing')
        setTimeout(() => {
          setAavePositions(mockAavePositions)
          setIsLoadingAave(false)
        }, 1000) // Simulate loading delay
        return
      }

      const aaveUtils = await getAaveUtils(provider || undefined)
      if (aaveUtils) {
        const positions = await aaveUtils.getUserAavePositions(address)
        console.log('Fetched Aave positions:', positions)
        setAavePositions(positions)
      } else {
        const error = 'Failed to initialize Aave utils - using default RPC provider'
        console.error(error)
        setAaveError(error)
        setAavePositions([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error fetching Aave positions:', error)
      setAaveError(`Error fetching positions: ${errorMessage}`)
      setAavePositions([])
    } finally {
      if (!useMockAavePositions) {
        setIsLoadingAave(false)
      }
    }
  }

  // Fetch PIV positions
  const fetchPivPositions = async () => {
    if (!address) return

    setIsLoadingPiv(true)
    try {
      const pivUtils = await getPivUtils()
      if (pivUtils) {
        const positions = await pivUtils.getUserPivPositions(address)
        setPivPositions(positions)
      } else {
        // Fallback to mock data store
        setPivPositions(mockDataStore.getPivPositions())
      }
    } catch (error) {
      console.error('Error fetching PIV positions:', error)
      // Fallback to mock data
      setPivPositions(mockDataStore.getPivPositions())
    } finally {
      setIsLoadingPiv(false)
    }
  }

  // Fetch orders from server
  const fetchOrders = async () => {
    setIsLoadingOrders(true)
    try {
      const ordersData = await orderApi.getOrders(address || undefined)
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [isConnected])

  // Add debug logging
  useEffect(() => {
    console.log('Wallet state:', { isConnected, address })
  }, [isConnected, address])

  useEffect(() => {
    if (isConnected && address) {
      console.log('Fetching positions for address:', address)
      fetchAavePositions()
      fetchPivPositions()
    } else {
      console.log('Wallet not connected, clearing positions')
      setAavePositions([])
      setPivPositions([])
    }
  }, [isConnected, address])

  // Add a refresh effect when wallet connects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isConnected && address && aavePositions.length === 0 && !isLoadingAave) {
        console.log('Retrying Aave positions fetch after delay')
        fetchAavePositions()
      }
    }, 2000) // Wait 2 seconds after connection

    return () => clearTimeout(timer)
  }, [isConnected, address, aavePositions.length, isLoadingAave])

  return (
    <Dialog open={isMigrationDialogOpen} onOpenChange={handleDialogClose}>
      <div className="flex flex-col items-center gap-6 p-4 min-h-[calc(100vh-120px)]">
        {/* Debug info - remove in production
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 p-2 rounded text-sm w-full max-w-6xl">
            <strong>Debug Info:</strong> Connected: {isConnected ? 'Yes' : 'No'}, Address: {address || 'None'}
            {useMockAavePositions && <span className="ml-4 text-blue-600">[Mock Data Enabled]</span>}
            <br />
            <strong>Aave Positions:</strong> {aavePositions.length} found, Loading: {isLoadingAave ? 'Yes' : 'No'}
            {aaveError && <span className="text-red-600 ml-2">Error: {aaveError}</span>}
            <br />
            {isConnected && address && (
              <Button
                onClick={() => testAaveConnection(address)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Test Aave Connection
              </Button>
            )}
          </div>
        )} */}

        {/* Positions Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl items-start">
          {/* AAVE Position Card */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AAVE Position</CardTitle>
              {isConnected && (
                <Button
                  onClick={fetchAavePositions}
                  disabled={isLoadingAave}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {isLoadingAave ? 'Loading...' : 'Refresh'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 max-h-[300px] overflow-y-auto">
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">Please connect your wallet to view Aave positions</p>
                  <p className="text-sm text-gray-500">Use the "Connect Wallet" button in the top right corner</p>
                </div>
              ) : isLoadingAave ? (
                <div className="text-center py-4">Loading Aave positions...</div>
              ) : aaveError ? (
                <div className="text-center py-4 text-red-500">
                  <p className="mb-2">{aaveError}</p>
                  <Button
                    onClick={fetchAavePositions}
                    variant="outline"
                    size="sm"
                  >
                    Retry
                  </Button>
                </div>
              ) : aavePositions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No Aave positions found</p>
                  <p className="text-sm">Connected to: {address}</p>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-3 gap-4 text-sm border-b border-gray-200 pb-2 text-gray-600 font-semibold">
                    <p>Type</p>
                    <p>Collateral Token</p>
                    <p>Amount</p>
                  </div>
                  {aavePositions.map((position) => (
                    <div
                      key={position.id}
                      className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-4 rounded-md gap-4"
                    >
                      <div className="grid grid-cols-3 gap-4 w-full md:w-auto md:flex-grow">
                        <div className="flex flex-col">
                          <p className={`font-medium text-lg capitalize ${position.type === 'collateral' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {position.type}
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <p className="font-medium text-lg">{position.token}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-xl">{position.formattedAmount}</p>
                        </div>
                      </div>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => openMigrationDialog(position, "aaveToVault")}
                          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)] w-full md:w-auto"
                        >
                          Migrate
                        </Button>
                      </DialogTrigger>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Vault Position Card */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vault Position</CardTitle>
              {isConnected && (
                <Button
                  onClick={fetchPivPositions}
                  disabled={isLoadingPiv}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {isLoadingPiv ? 'Loading...' : 'Refresh'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 max-h-[300px] overflow-y-auto">
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">Please connect your wallet to view vault positions</p>
                  <p className="text-sm text-gray-500">Use the "Connect Wallet" button in the top right corner</p>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2 text-gray-600 font-semibold">
                    <p>Type</p>
                    <p>Position</p>
                  </div>
                  {isLoadingPiv ? (
                    <div className="text-center py-4">Loading PIV positions...</div>
                  ) : pivPositions.length > 0 ? (
                    pivPositions.map((position) => (
                      <div
                        key={position.id}
                        className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-4 rounded-md gap-4"
                      >
                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex-grow">
                          <div className="flex flex-col">
                            <p className="font-medium text-lg capitalize">{position.type}</p>
                            <p className="text-sm text-gray-600">{position.orderId ? `Order: ${position.orderId}` : 'Direct'}</p>
                          </div>
                          <div className="flex flex-col">
                            <p className="font-medium text-lg">{position.token}</p>
                            <p className="font-bold text-xl">{position.formattedAmount}</p>
                          </div>
                        </div>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => openMigrationDialog(position, "placeOrder")}
                            className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)] w-full md:w-auto"
                            disabled={position.type === 'debt'} // Only allow orders for collateral
                          >
                            Create Order
                          </Button>
                        </DialogTrigger>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No PIV positions found. Migrate from Aave to create positions.
                    </div>
                  )}

                  {/* Fallback to old vault positions for demo if no PIV positions */}
                  {!isLoadingPiv && pivPositions.length === 0 && vaultPositions.map((position) => (
                    <div
                      key={position.id}
                      className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-4 rounded-md gap-4"
                    >
                      <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex-grow">
                        <div className="flex flex-col">
                          <p className="font-medium text-lg">{position.debt.token}</p>
                          <p className="font-bold text-xl">{position.debt.amount}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="font-medium text-lg">{position.collateral.token}</p>
                          <p className="font-bold text-xl">{position.collateral.amount}</p>
                        </div>
                      </div>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => openMigrationDialog(position, "placeOrder")}
                          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)] w-full md:w-auto"
                        >
                          Place Order
                        </Button>
                      </DialogTrigger>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order List Card */}
        <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full max-w-6xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order list</CardTitle>
            {isConnected && (
              <Button
                onClick={fetchOrders}
                disabled={isLoadingOrders}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isLoadingOrders ? 'Loading...' : 'Refresh'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">Please connect your wallet to view order list</p>
                <p className="text-sm text-gray-500">Use the "Connect Wallet" button in the top right corner</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Owner</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Collateral Token</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Collateral Amount</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Debt Token</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Price</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">Loading orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-500">No orders found</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-4 text-sm font-medium truncate max-w-32">{order.owner}</td>
                          <td className="py-2 px-4 text-sm font-medium">{order.collateralToken}</td>
                          <td className="py-2 px-4 text-sm font-medium">{order.collateralAmount}</td>
                          <td className="py-2 px-4 text-sm font-medium">{order.debtToken}</td>
                          <td className="py-2 px-4 text-sm font-medium">
                            {editingOrderId === order._id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={newPriceInput}
                                  onChange={(e) => setNewPriceInput(e.target.value)}
                                  className="w-20 h-8 text-xs"
                                  placeholder={order.price.toString()}
                                />
                                <Button
                                  onClick={() => handleUpdateOrder(order._id, newPriceInput)}
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                                >
                                  ✓
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingOrderId(null)
                                    setNewPriceInput("")
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              order.price
                            )}
                          </td>
                          <td className={`py-2 px-4 text-sm font-medium ${order.status === 'OPEN' ? 'text-green-600' : order.status === 'FILLED' ? 'text-blue-600' : 'text-gray-600'}`}>
                            {order.status}
                          </td>
                          <td className="py-2 px-4 text-sm">
                            {order.status === 'OPEN' && (
                              <div className="flex items-center gap-2">
                                {editingOrderId !== order._id ? (
                                  <>
                                    <Button
                                      onClick={() => {
                                        setEditingOrderId(order._id)
                                        setNewPriceInput(order.price.toString())
                                      }}
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                    >
                                      更新
                                    </Button>
                                    <Button
                                      onClick={() => handleCancelOrder(order._id)}
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 px-2 text-xs"
                                    >
                                      取消订单
                                    </Button>
                                  </>
                                ) : null}

                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Migration Dialog Content */}
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>
            {migrationType === "aaveToVault" ? "Migrate AAVE Position to Vault" : "Place Swap Order"}
          </DialogTitle>
          <DialogDescription>Enter the details for your {migrationType === "aaveToVault" ? "migration" : "order"}. Click confirm when you're done.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collateral-token" className="text-right">
              Collateral Token
            </Label>
            <Select value={selectedCollateralToken} onValueChange={setSelectedCollateralToken}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select collateral token" />
              </SelectTrigger>
              <SelectContent>
                {currentMigrationPosition && (
                  <SelectItem value={currentMigrationPosition.token}>
                    {currentMigrationPosition.token}
                  </SelectItem>
                )}
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="WBTC">WBTC</SelectItem>
                <SelectItem value="WETH">WETH</SelectItem>
                <SelectItem value="LINK">LINK</SelectItem>
                <SelectItem value="AAVE">AAVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collateral-amount" className="text-right">
              Collateral Amount
            </Label>
            <Input
              id="collateral-amount"
              type="number"
              value={collateralAmountInput}
              onChange={(e) => setCollateralAmountInput(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 1000"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="debt-token" className="text-right">
              Debt Token
            </Label>
            <Select value={selectedDebtToken} onValueChange={setSelectedDebtToken}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select debt token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="WBTC">WBTC</SelectItem>
                <SelectItem value="WETH">WETH</SelectItem>
                <SelectItem value="LINK">LINK</SelectItem>
                <SelectItem value="AAVE">AAVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {migrationType === "aaveToVault" ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debt-amount" className="text-right">
                Debt Amount
              </Label>
              <Input
                id="debt-amount"
                type="number"
                value={debtAmountInput}
                onChange={(e) => setDebtAmountInput(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 1.05"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate-type" className="text-right">
              Interest Rate
            </Label>
            <Select value={selectedInterestRateType} onValueChange={setSelectedInterestRateType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select rate type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="dynamic">Dynamic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleConfirmMigration}
            disabled={isMigrating}
            className="bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-pink hover:to-accent-purple text-white font-semibold"
          >
            {isMigrating ? 'Processing...' : (migrationType === "aaveToVault" ? 'Confirm Migration' : 'Create Order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}