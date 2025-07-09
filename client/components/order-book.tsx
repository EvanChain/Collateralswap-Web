"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Order {
  price: number
  size: number
}

// Helper to generate initial mock data - EXPORTED
export const generateInitialMockData = () => {
  const bids: Order[] = []
  const asks: Order[] = []
  const basePrice = 2900 // Example base price for WETH/USDC

  // Generate bids
  for (let i = 0; i < 10; i++) {
    bids.push({
      price: basePrice - i * (Math.random() * 5 + 1), // Decreasing prices
      size: Math.floor(Math.random() * 100) + 10, // Random sizes
    })
  }

  // Generate asks
  for (let i = 0; i < 10; i++) {
    asks.push({
      price: basePrice + i * (Math.random() * 5 + 1), // Increasing prices
      size: Math.floor(Math.random() * 100) + 10, // Random sizes
    })
  }

  return {
    bids: bids.sort((a, b) => b.price - a.price), // Sort bids descending
    asks: asks.sort((a, b) => a.price - b.price), // Sort asks ascending
  }
}

// Helper to simulate updates to mock data - EXPORTED
export const updateMockData = (currentOrders: Order[], isBid: boolean) => {
  const newOrders = [...currentOrders]
  const action = Math.random() // 0-1 for add/remove/modify

  if (newOrders.length < 5 || action < 0.3) {
    // Add a new order
    const basePrice = newOrders[0]?.price || 2900
    const newPrice = isBid ? basePrice - Math.random() * 10 : basePrice + Math.random() * 10
    newOrders.push({
      price: Number.parseFloat(newPrice.toFixed(2)),
      size: Math.floor(Math.random() * 50) + 5,
    })
  } else if (action < 0.6 && newOrders.length > 2) {
    // Remove an order
    const indexToRemove = Math.floor(Math.random() * newOrders.length)
    newOrders.splice(indexToRemove, 1)
  } else {
    // Modify an existing order
    const indexToModify = Math.floor(Math.random() * newOrders.length)
    if (newOrders[indexToModify]) {
      newOrders[indexToModify].size = Math.floor(Math.random() * 100) + 10
      newOrders[indexToModify].price = Number.parseFloat(
        (newOrders[indexToModify].price + (Math.random() - 0.5) * 2).toFixed(2),
      ) // Slight price fluctuation
    }
  }

  return newOrders
}

// Helper to calculate depth chart SVG path data
const calculateDepthChartData = (bids: Order[], asks: Order[], width: number, height: number) => {
  if (width === 0 || height === 0) {
    return { bidsPath: "", asksPath: "", maxVolume: 0 }
  }

  // Calculate cumulative volumes
  let cumulativeBids: { price: number; volume: number }[] = []
  let currentVolume = 0
  for (let i = bids.length - 1; i >= 0; i--) {
    currentVolume += bids[i].size
    cumulativeBids.push({ price: bids[i].price, volume: currentVolume })
  }
  cumulativeBids = cumulativeBids.reverse() // Sort by price ascending for chart

  const cumulativeAsks: { price: number; volume: number }[] = []
  currentVolume = 0
  for (let i = 0; i < asks.length; i++) {
    currentVolume += asks[i].size
    cumulativeAsks.push({ price: asks[i].price, volume: currentVolume })
  }

  // Determine price range
  const allPrices = [...bids.map((b) => b.price), ...asks.map((a) => a.price)]
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const priceRange = maxPrice - minPrice

  // Determine max volume for scaling
  const maxBidVolume = cumulativeBids.length > 0 ? Math.max(...cumulativeBids.map((b) => b.volume)) : 0
  const maxAskVolume = cumulativeAsks.length > 0 ? Math.max(...cumulativeAsks.map((a) => a.volume)) : 0
  const maxTotalVolume = Math.max(maxBidVolume, maxAskVolume)

  if (priceRange === 0 || maxTotalVolume === 0) {
    return { bidsPath: "", asksPath: "", maxVolume: 0 }
  }

  // Generate SVG paths
  const bidsPath = cumulativeBids
    .map((d, i) => {
      const x = ((d.price - minPrice) / priceRange) * width
      const y = height - (d.volume / maxTotalVolume) * height
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  const asksPath = cumulativeAsks
    .map((d, i) => {
      const x = ((d.price - minPrice) / priceRange) * width
      const y = height - (d.volume / maxTotalVolume) * height
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  // Add closing paths for area fill
  const bidsAreaPath =
    bidsPath +
    ` L ${(((cumulativeBids[cumulativeBids.length - 1]?.price || minPrice) - minPrice) / priceRange) * width} ${height} L ${(((cumulativeBids[0]?.price || minPrice) - minPrice) / priceRange) * width} ${height} Z`

  const asksAreaPath =
    asksPath +
    ` L ${(((cumulativeAsks[cumulativeAsks.length - 1]?.price || maxPrice) - minPrice) / priceRange) * width} ${height} L ${(((cumulativeAsks[0]?.price || maxPrice) - minPrice) / priceRange) * width} ${height} Z`

  return { bidsPath: bidsAreaPath, asksPath: asksAreaPath, maxVolume: maxTotalVolume }
}

export default function OrderBook({ className, bids, asks }: { className?: string; bids: Order[]; asks: Order[] }) {
  const [chartData, setChartData] = useState<{
    bidsPath: string
    asksPath: string
    maxVolume: number
  }>({ bidsPath: "", asksPath: "", maxVolume: 0 })
  const chartRef = useRef<HTMLDivElement>(null)

  // Effect for chart data calculation (on bids/asks or resize)
  useEffect(() => {
    const updateChart = () => {
      if (chartRef.current) {
        const { clientWidth, clientHeight } = chartRef.current
        setChartData(calculateDepthChartData(bids, asks, clientWidth, clientHeight))
      }
    }

    updateChart() // Initial calculation
    window.addEventListener("resize", updateChart) // Recalculate on resize

    return () => window.removeEventListener("resize", updateChart)
  }, [bids, asks]) // Depend on bids and asks props

  return (
    <Card
      className={cn(
        "bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10",
        className,
      )}
    >
      <CardHeader>
        <CardTitle>Order Book & Depth Chart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Book Table */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold text-accent-green mb-2">Bids (Price / Size)</h3>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {bids.map((order, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className="text-green-600 font-mono">{order.price.toFixed(2)}</span>
                  <span className="text-gray-600 font-mono">{order.size.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-red-600 mb-2">Asks (Price / Size)</h3>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {asks.map((order, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className="text-red-600 font-mono">{order.price.toFixed(2)}</span>
                  <span className="text-gray-600 font-mono">{order.size.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Depth Chart */}
        <div ref={chartRef} className="w-full h-48 mt-4 relative bg-gray-100 rounded-lg">
          {chartData.bidsPath && chartData.asksPath ? (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${chartRef.current?.clientWidth || 1} ${chartRef.current?.clientHeight || 1}`}
            >
              {/* Bid path */}
              <path d={chartData.bidsPath} fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" strokeWidth="1" />
              {/* Ask path */}
              <path d={chartData.asksPath} fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1" />
            </svg>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">Loading Chart...</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
