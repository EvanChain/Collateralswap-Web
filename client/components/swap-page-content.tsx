"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown } from "lucide-react"
import OrderBook, { generateInitialMockData, updateMockData } from "./order-book"
import DeFiAnimation from "./defi-animation"
import { useIRouter } from "../hooks/useIRouter"
import { TokenUSDC, TokenUSDT, TokenWBTC, TokenLINK, TokenAAVE, TokenEURS } from "@web3icons/react"

import {
  API_CONFIG,
  CONTRACT_CONFIG,
  TOKEN_CONFIG,
  APP_CONFIG,
  formatApiUrl,
  getTokenBySymbol
} from "../config/appConfig"
import { orderApi } from "../lib/api"

// Token icon mapping
const tokenIconMap: Record<string, React.ComponentType<any>> = {
  USDC: TokenUSDC,
  USDT: TokenUSDT,
  WBTC: TokenWBTC,
  LINK: TokenLINK,
  AAVE: TokenAAVE,
  EURS: TokenEURS,
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

// Use tokens from config
const tokens = TOKEN_CONFIG.SUPPORTED_TOKENS.map(token => ({
  value: token.symbol.toLowerCase(),
  label: token.symbol,
  address: token.address
}))

interface Order {
  price: number
  size: number
}

export default function SwapPageContent() {
  const [fromToken, setFromToken] = useState(tokens[0])
  const [toToken, setToToken] = useState(tokens[1])
  const [payAmount, setPayAmount] = useState("") // Initialize to empty string
  const [receiveAmount, setReceiveAmount] = useState("0.00")
  const [mockBalance, setMockBalance] = useState(10000.0) // Mock user balance
  const [bids, setBids] = useState<Order[]>([])
  const [asks, setAsks] = useState<Order[]>([])
  const [isSwapping, setIsSwapping] = useState(false)
  const { swapWithRouter } = useIRouter()

  useEffect(() => {
    const initialData = generateInitialMockData()
    setBids(initialData.bids)
    setAsks(initialData.asks)

    const interval = setInterval(() => {
      setBids((prevBids) => {
        const updated = updateMockData(prevBids, true)
        return updated.sort((a, b) => b.price - a.price).slice(0, 10)
      })
      setAsks((prevAsks) => {
        const updated = updateMockData(prevAsks, false)
        return updated.sort((a, b) => a.price - b.price).slice(0, 10)
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  const calculateReceiveAmount = () => {
    const amount = Number.parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0 || bids.length === 0 || asks.length === 0) {
      setReceiveAmount("0.00")
      return
    }

    let calculatedAmount = 0
    if (fromToken.value === "usdc" && toToken.value === "weth") {
      const bestAskPrice = asks[0]?.price
      if (bestAskPrice) {
        calculatedAmount = amount / bestAskPrice
      }
    } else if (fromToken.value === "weth" && toToken.value === "usdc") {
      const bestBidPrice = bids[0]?.price
      if (bestBidPrice) {
        calculatedAmount = amount * bestBidPrice
      }
    } else {
      calculatedAmount = amount // Fallback for same token or unhandled pairs
    }

    setReceiveAmount(calculatedAmount.toFixed(2))
  }

  useEffect(() => {
    calculateReceiveAmount()
  }, [payAmount, fromToken, toToken, bids, asks])

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    // When swapping tokens, also swap the amounts and update the balance context
    const currentPayAmount = payAmount
    const currentReceiveAmount = receiveAmount
    setPayAmount(currentReceiveAmount)
    setReceiveAmount(currentPayAmount)
    // For simplicity, mock balance remains the same, but in a real app, it would change based on the new fromToken
    // setMockBalance(newBalanceForNewFromToken);
  }

  const handleMaxClick = () => {
    setPayAmount(mockBalance.toFixed(2)) // Set payAmount to mock balance
  }

  const handleConfirmSwap = async () => {
    if (!payAmount || Number.parseFloat(payAmount) <= 0) {
      alert("Please enter a valid pay amount")
      return
    }

    if (!fromToken || !toToken) {
      alert("Please select both tokens")
      return
    }

    setIsSwapping(true)

    try {
      // Get token configurations
      const fromTokenConfig = getTokenBySymbol(fromToken.label)
      const toTokenConfig = getTokenBySymbol(toToken.label)

      if (!fromTokenConfig || !toTokenConfig) {
        throw new Error('Token configuration not found')
      }

      // Convert amounts to Wei (using proper decimals)
      const amountIn = (Number.parseFloat(payAmount) * Math.pow(10, fromTokenConfig.decimals)).toString()
      const minAmountOut = (Number.parseFloat(receiveAmount) * APP_CONFIG.DEFAULT_SLIPPAGE * Math.pow(10, toTokenConfig.decimals)).toString()

      // Call backend to find matching orders
      const fillResult = await orderApi.fillOrder({
        tokenIn: fromTokenConfig.address,
        tokenOut: toTokenConfig.address,
        amountIn: amountIn,
        minAmountOut: minAmountOut
      })

      if (!fillResult.matchDetails || fillResult.matchDetails.length === 0) {
        throw new Error('No matching orders found')
      }

      // Extract matched order IDs
      const matchedOrderIds = fillResult.matchDetails.map((detail: any) => detail.orderId)

      // Prepare swap data for IRouter contract
      const swapData = {
        tokenIn: fromTokenConfig.address,
        tokenOut: toTokenConfig.address,
        amountIn: amountIn,
        minAmountOut: minAmountOut,
        orderDatas: [
          {
            pivAddress: CONTRACT_CONFIG.PIV_ADDRESS,
            orderIds: matchedOrderIds
          }
        ]
      }

      // Call IRouter contract swap method
      const swapResult = await swapWithRouter(swapData)

      // Update UI with successful swap
      alert(`Swap successful! Received: ${swapResult.netAmountOut} ${toToken.label}`)

      // Reset form
      setPayAmount("")
      setReceiveAmount("0.00")

    } catch (error) {
      console.error('Swap failed:', error)
      alert(`Swap failed: ${(error as Error).message}`)
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col items-center text-center space-y-6 w-full max-w-3xl mx-auto lg:mx-0">
          <DeFiAnimation />

          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-accent-purple to-accent-pink text-transparent bg-clip-text">
            Your DeFi Assets, Secured.
            <br />
            Your Future, Unlocked.
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl">
            Personal Insurance Vault offers a one-stop solution for DeFi lending users, providing robust risk management
            for borrowing positions and flexible exit strategies for collateral. Migrate your Aave and Compound
            positions to an isolated contract for simplified, secure management.
          </p>
        </div>

        <div className="flex flex-col space-y-6">
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex-grow">
            <CardHeader>
              <CardTitle>Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input 1 - You pay */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="swap-input-1" className="text-gray-600">
                    You pay
                  </Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">
                      Balance: {mockBalance.toFixed(2)} {fromToken.label}
                    </p>
                    <Button
                      variant="ghost"
                      className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto"
                      onClick={handleMaxClick}
                    >
                      Max
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(value) => setFromToken(tokens.find((t) => t.value === value) || tokens[0])}
                    value={fromToken.value}
                  >
                    <SelectTrigger className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full px-4 h-14 w-1/4">
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
                  <Input
                    id="swap-input-1"
                    type="number"
                    placeholder="3000" // Now a placeholder
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-3/4 bg-transparent border-none text-2xl font-bold focus:ring-0 focus:outline-none p-0 text-right"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gray-100 hover:bg-gray-200"
                  onClick={handleSwapTokens}
                >
                  <ArrowUpDown className="h-5 w-5 text-gray-600" />
                </Button>
              </div>

              {/* Input 2 - You receive */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="swap-input-2" className="text-gray-600">
                    You will receive
                  </Label>
                  {/* Balance for receive token (optional, can be added if needed) */}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(value) => setToToken(tokens.find((t) => t.value === value) || tokens[1])}
                    value={toToken.value}
                  >
                    <SelectTrigger className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-full px-4 h-14 w-1/4">
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
                  <Input
                    id="swap-input-2"
                    type="number"
                    placeholder="0.0"
                    value={receiveAmount}
                    readOnly
                    className="w-3/4 bg-transparent border-none text-2xl font-bold focus:ring-0 focus:outline-none p-0 text-right"
                  />
                </div>
              </div>

              <Button
                onClick={handleConfirmSwap}
                disabled={isSwapping}
                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-pink hover:to-accent-purple text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(192,132,252,0.7)] disabled:opacity-50 disabled:cursor-not-allowed">
                {isSwapping ? 'Swapping...' : 'Swap Now'}
              </Button>
            </CardContent>
          </Card>

          <OrderBook className="flex-grow" bids={bids} asks={asks} />
        </div>
      </div>
    </div>
  )
}
