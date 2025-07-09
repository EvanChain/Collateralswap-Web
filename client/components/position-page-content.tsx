"use client"

import { useState } from "react"
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

// Mock data for AAVE positions, now structured to combine debt and collateral for each position
const aavePositions = [
  {
    id: 1,
    debt: { token: "USDC", amount: 5000 },
    collateral: { token: "WBTC", amount: 1 },
  },
  {
    id: 2,
    debt: { token: "DAI", amount: 1500 },
    collateral: { token: "ETH", amount: 0.5 },
  },
  {
    id: 3,
    debt: { token: "USDT", amount: 2000 },
    collateral: { token: "LINK", amount: 300 },
  },
  {
    id: 4,
    debt: { token: "UNI", amount: 100 },
    collateral: { token: "AAVE", amount: 5 },
  },
]

// Mock data for Vault positions, now structured to combine debt and collateral for each position
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
  const [migrationType, setMigrationType] = useState<"aaveToVault" | "vaultToAave" | null>(null)
  const [selectedMigrateToken, setSelectedMigrateToken] = useState<string>("")
  const [migrateAmountInput, setMigrateAmountInput] = useState<string>("")
  const [selectedInterestRateType, setSelectedInterestRateType] = useState<string>("")
  const { migrateFromAave, migrateFromVault } = usePivOrderBook()

  const openMigrationDialog = (position: any, type: "aaveToVault" | "vaultToAave") => {
    setCurrentMigrationPosition(position)
    setMigrationType(type)
    setSelectedMigrateToken(position.debt.token) // Default to debt token
    setMigrateAmountInput("") // Clear previous input
    setSelectedInterestRateType("static") // Default to static
    setIsMigrationDialogOpen(true)
  }

  const handleConfirmMigration = async () => {
    if (!currentMigrationPosition || !selectedMigrateToken || !migrateAmountInput || !selectedInterestRateType) {
      alert("Please fill all migration details.")
      return
    }

    const amount = Number.parseFloat(migrateAmountInput)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.")
      return
    }

    try {
      if (migrationType === "aaveToVault") {
        // 这里假设 collateralAtoken, atokenAmount, debtToken, debtAmount, interestRateMode 都有对应的 mock 数据
        await migrateFromAave(
          currentMigrationPosition.collateral.token, // collateralAtoken
          currentMigrationPosition.collateral.amount, // atokenAmount
          currentMigrationPosition.debt.token, // debtToken
          currentMigrationPosition.debt.amount, // debtAmount
          selectedInterestRateType === "static" ? 1 : 2, // interestRateMode, 1: static, 2: dynamic
        )
      } else if (migrationType === "vaultToAave") {
        // 你需要在 usePivOrderBook 里实现 migrateToVault
        await migrateFromVault(
          currentMigrationPosition.collateral.token,
          currentMigrationPosition.collateral.amount,
          currentMigrationPosition.debt.token,
          currentMigrationPosition.debt.amount,
          selectedInterestRateType === "static" ? 1 : 2,
        )
      }
      setIsMigrationDialogOpen(false)
    } catch (e) {
      alert("Migration failed: " + (e as Error).message)
    }
  }

  const availableTokens = currentMigrationPosition
    ? [currentMigrationPosition.debt.token, currentMigrationPosition.collateral.token]
    : []

  return (
    <Dialog open={isMigrationDialogOpen} onOpenChange={setIsMigrationDialogOpen}>
      <div className="flex flex-col items-center gap-6 p-4 min-h-[calc(100vh-120px)]">
        {/* Positions Cards - Now side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl items-start">
          {/* AAVE Position Card */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full">
            <CardHeader>
              <CardTitle>AAVE Position</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 max-h-[300px] overflow-y-auto">
              {/* Table Header */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2 text-gray-600 font-semibold">
                <p>Debt</p>
                <p>Collateral</p>
              </div>
              {aavePositions.map((position) => (
                <div
                  key={position.id}
                  className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-4 rounded-md gap-4"
                >
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex-grow">
                    {/* Debt */}
                    <div className="flex flex-col">
                      <p className="font-medium text-lg">{position.debt.token}</p>
                      <p className="font-bold text-xl">{position.debt.amount}</p>
                    </div>
                    {/* Collateral */}
                    <div className="flex flex-col">
                      <p className="font-medium text-lg">{position.collateral.token}</p>
                      <p className="font-bold text-xl">{position.collateral.amount}</p>
                    </div>
                  </div>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => openMigrationDialog(position, "aaveToVault")}
                      className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)] w-full md:w-auto"
                    >
                      Migrate to Vault
                    </Button>
                  </DialogTrigger>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Vault Position Card */}
          <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full">
            <CardHeader>
              <CardTitle>Vault Position</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 max-h-[300px] overflow-y-auto">
              {/* Table Header */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-2 text-gray-600 font-semibold">
                <p>Debt</p>
                <p>Collateral</p>
              </div>
              {vaultPositions.map((position) => (
                <div
                  key={position.id}
                  className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-4 rounded-md gap-4"
                >
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex-grow">
                    {/* Debt */}
                    <div className="flex flex-col">
                      <p className="font-medium text-lg">{position.debt.token}</p>
                      <p className="font-bold text-xl">{position.debt.amount}</p>
                    </div>
                    {/* Collateral */}
                    <div className="flex flex-col">
                      <p className="font-medium text-lg">{position.collateral.token}</p>
                      <p className="font-bold text-xl">{position.collateral.amount}</p>
                    </div>
                  </div>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => openMigrationDialog(position, "vaultToAave")}
                      className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-purple hover:to-accent-blue text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.7)] w-full md:w-auto"
                    >
                      Migrate to AAVE
                    </Button>
                  </DialogTrigger>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order List Card - Now below the position cards */}
        <Card className="bg-white border-gray-200 text-gray-900 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 w-full max-w-6xl">
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

      {/* Migration Dialog Content */}
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>
            {migrationType === "aaveToVault" ? "Migrate AAVE Position to Vault" : "Migrate Vault Position to AAVE"}
          </DialogTitle>
          <DialogDescription>Enter the details for your migration. Click confirm when you're done.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token" className="text-right">
              Token
            </Label>
            <Select value={selectedMigrateToken} onValueChange={setSelectedMigrateToken}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {currentMigrationPosition && (
                  <>
                    <SelectItem value={currentMigrationPosition.debt.token}>
                      {currentMigrationPosition.debt.token}
                    </SelectItem>
                    <SelectItem value={currentMigrationPosition.collateral.token}>
                      {currentMigrationPosition.collateral.token}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={migrateAmountInput}
              onChange={(e) => setMigrateAmountInput(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 1000"
            />
          </div>
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
            className="bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-pink hover:to-accent-purple text-white font-semibold"
          >
            Confirm Migration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
