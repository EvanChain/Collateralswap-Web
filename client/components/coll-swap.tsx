"use client"

import { useState } from "react" // Import useState for managing selected tokens
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components
import { ArrowUpDown } from "lucide-react" // Changed ArrowDown to ArrowUpDown
import OrderBook from "./order-book" // Import the new OrderBook component
import { TokenUSDC, TokenWBTC } from "@web3icons/react"

// Token icon mapping
const tokenIconMap: Record<string, React.ComponentType<any>> = {
  USDC: TokenUSDC,
  WETH: TokenWBTC, // Using WBTC icon as placeholder for WETH
}

// TokenIcon component
const TokenIcon = ({ symbol, size = 20 }: { symbol: string; size?: number }) => {
  const IconComponent = tokenIconMap[symbol.toUpperCase()]

  if (!IconComponent) {
    return (
      <div
        className="rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600"
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return <IconComponent size={size} />
}

// Define token data for reusability
const tokens = [
  { value: "usdc", label: "USDC" },
  { value: "weth", label: "WETH" },
  // Add more tokens as needed
]

export default function CollSwap() {
  // State to manage the selected tokens in the swap module
  const [fromToken, setFromToken] = useState(tokens[0]) // Default to USDC
  const [toToken, setToToken] = useState(tokens[1]) // Default to WETH

  // Function to swap fromToken and toToken
  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-8">
      {/* Header - This header is now redundant as MainNav is in layout.tsx */}
      {/* Main Content Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Positions & Order List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Positions Card */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* In Aave */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700">In Aave</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p className="text-gray-600">Type: debt</p>
                    <p className="font-medium text-lg">USDC</p>
                    <p className="font-bold text-xl">5000</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p className="text-gray-600">Type: collateral</p>
                    <p className="font-medium text-lg">WBTC</p>
                    <p className="font-bold text-xl">1</p>
                  </div>
                </div>
                <Button className="mt-4 w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)]">
                  Migrate from Aave
                </Button>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">In your Vault</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p className="text-gray-600">Type: debt</p>
                    <p className="font-medium text-lg">USDC</p>
                    <p className="font-bold text-xl">5000</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <p className="text-gray-600">Type: collateral</p>
                    <p className="font-medium text-lg">WBTC</p>
                    <p className="font-bold text-xl">1</p>
                  </div>
                </div>
                <Button className="mt-4 w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)]">
                  Migrate to CollSwap Vault
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order List Card */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <CardHeader>
              <CardTitle>Order list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm border-b border-gray-200 pb-2 text-gray-600 font-semibold">
                <p>Type</p>
                <p>Token</p>
                <p>Amount</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <p className="font-medium">debt</p>
                <p className="font-medium">USDC</p>
                <p className="font-medium">5000</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <p className="font-medium">collateral</p>
                <p className="font-medium">WBTC</p>
                <p className="font-bold text-xl">1</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Swap, Order Book & Depth Chart */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          {/* Swap Card (Uniswap style) */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex-grow">
            <CardHeader>
              <CardTitle>Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input 1 */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="swap-input-1" className="text-gray-600">
                    You pay
                  </Label>
                  <Button variant="ghost" className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto">
                    Max
                  </Button>
                </div>
                <div className="flex items-center">
                  <Input
                    id="swap-input-1"
                    type="number"
                    placeholder="0.0"
                    defaultValue="3000"
                    className="flex-1 bg-transparent border-none text-2xl font-bold focus:ring-0 focus:outline-none p-0"
                  />
                  {/* Token Selection for "You pay" */}
                  <Select
                    onValueChange={(value) => setFromToken(tokens.find((t) => t.value === value) || tokens[0])}
                    value={fromToken.value} // Use value prop for controlled component
                  >
                    <SelectTrigger className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full px-4 h-14">
                      <SelectValue placeholder="Select token">
                        {fromToken && (
                          <div className="flex items-center">
                            <TokenIcon symbol={fromToken.label} size={20} />
                            <span className="ml-2">{fromToken.label}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      {tokens.map((token) => (
                        <SelectItem
                          key={token.value}
                          value={token.value}
                          className="flex items-center data-[state=checked]:bg-gray-100 data-[highlighted]:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <TokenIcon symbol={token.label} size={20} />
                            <span className="ml-2">{token.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gray-100 hover:bg-gray-200"
                  onClick={handleSwapTokens} // Add onClick handler here
                >
                  <ArrowUpDown className="h-5 w-5 text-gray-600" /> {/* Changed icon here */}
                </Button>
              </div>

              {/* Input 2 */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="swap-input-2" className="text-gray-600">
                    You receive
                  </Label>
                  <p className="text-sm text-gray-600">Balance: 0.00 WETH</p>
                </div>
                <div className="flex items-center">
                  <Input
                    id="swap-input-2"
                    type="number"
                    placeholder="0.0"
                    className="flex-1 bg-transparent border-none text-2xl font-bold focus:ring-0 focus:outline-none p-0"
                  />
                  {/* Token Selection for "You receive" */}
                  <Select
                    onValueChange={(value) => setToToken(tokens.find((t) => t.value === value) || tokens[1])}
                    value={toToken.value} // Use value prop for controlled component
                  >
                    <SelectTrigger className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full px-4 h-14">
                      <SelectValue placeholder="Select token">
                        {toToken && (
                          <div className="flex items-center">
                            <TokenIcon symbol={toToken.label} size={20} />
                            <span className="ml-2">{toToken.label}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      {tokens.map((token) => (
                        <SelectItem
                          key={token.value}
                          value={token.value}
                          className="flex items-center data-[state=checked]:bg-gray-100 data-[highlighted]:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <TokenIcon symbol={token.label} size={20} />
                            <span className="ml-2">{token.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-pink hover:to-accent-purple text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(192,132,252,0.7)]">
                Swap Now
              </Button>
              <p className="text-xs text-gray-600 text-center">
                Pop a tab to choose token pairs and amounts after click
              </p>
            </CardContent>
          </Card>

          {/* Order Book & Depth Chart Component */}
          <OrderBook
            className="flex-grow"
            bids={[]}
            asks={[]}
          />
        </div>
      </main>
    </div>
  )
}
