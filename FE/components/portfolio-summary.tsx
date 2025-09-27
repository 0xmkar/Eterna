"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from "lucide-react"

interface PortfolioData {
  totalBalance: number
  availableMargin: number
  usedMargin: number
  totalPnL: number
  totalPnLPercentage: number
  marginUtilization: number
  positionsCount: number
  riskLevel: "low" | "medium" | "high"
}

export function PortfolioSummary() {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalBalance: 2.5,
    availableMargin: 0.942,
    usedMargin: 1.558,
    totalPnL: 0.00409,
    totalPnLPercentage: 0.164,
    marginUtilization: 62.3,
    positionsCount: 2,
    riskLevel: "medium",
  })

  const formatBTC = (value: number) => `${value.toFixed(6)} BTC`
  const formatUSD = (value: number, btcPrice = 52150) => `$${(value * btcPrice).toLocaleString()}`
  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-long"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-short"
      default:
        return "text-muted-foreground"
    }
  }

  const getPnLColor = (pnl: number) => (pnl >= 0 ? "text-long" : "text-short")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBTC(portfolio.totalBalance)}</div>
          <p className="text-xs text-muted-foreground">{formatUSD(portfolio.totalBalance)}</p>
        </CardContent>
      </Card>

      {/* Unrealized PnL */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unrealized PnL</CardTitle>
          {portfolio.totalPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-long" />
          ) : (
            <TrendingDown className="h-4 w-4 text-short" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getPnLColor(portfolio.totalPnL)}`}>{formatBTC(portfolio.totalPnL)}</div>
          <p className={`text-xs ${getPnLColor(portfolio.totalPnL)}`}>
            {formatPercentage(portfolio.totalPnLPercentage)}
          </p>
        </CardContent>
      </Card>

      {/* Available Margin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Margin</CardTitle>
          <Badge variant="outline" className="text-xs">
            {portfolio.positionsCount} positions
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBTC(portfolio.availableMargin)}</div>
          <p className="text-xs text-muted-foreground">Used: {formatBTC(portfolio.usedMargin)}</p>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${getRiskColor(portfolio.riskLevel)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold capitalize ${getRiskColor(portfolio.riskLevel)}`}>
            {portfolio.riskLevel}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Margin Utilization</span>
              <span>{portfolio.marginUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={portfolio.marginUtilization} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
