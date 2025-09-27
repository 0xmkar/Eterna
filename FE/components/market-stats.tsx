"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Users, Clock, DollarSign } from "lucide-react"

interface MarketData {
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  openInterest: number
  fundingRate: number
  nextFundingTime: number
  longShortRatio: number
  totalLongs: number
  totalShorts: number
  indexPrice: number
  markPrice: number
}

export function MarketStats() {
  const [marketData, setMarketData] = useState<MarketData>({
    price: 52150,
    change24h: 1234.56,
    changePercent24h: 2.43,
    volume24h: 1234.56,
    openInterest: 892.34,
    fundingRate: 0.0125,
    nextFundingTime: Date.now() + 2 * 60 * 60 * 1000 + 34 * 60 * 1000, // 2h 34m from now
    longShortRatio: 1.23,
    totalLongs: 490.45,
    totalShorts: 401.89,
    indexPrice: 52145,
    markPrice: 52150,
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData((prev) => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 100,
        markPrice: prev.markPrice + (Math.random() - 0.5) * 100,
        volume24h: prev.volume24h + Math.random() * 10,
        openInterest: prev.openInterest + (Math.random() - 0.5) * 5,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const formatBTC = (value: number) => `${value.toFixed(2)} BTC`
  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  const formatLargeNumber = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const formatTime = (timestamp: number) => {
    const diff = timestamp - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const getPriceChangeColor = (change: number) => (change >= 0 ? "text-long" : "text-short")
  const getFundingRateColor = (rate: number) => (rate >= 0 ? "text-long" : "text-short")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Price */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">BTC-PERP Price</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(marketData.price)}</div>
          <div className={`text-sm flex items-center gap-1 ${getPriceChangeColor(marketData.change24h)}`}>
            {marketData.changePercent24h >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatPercentage(marketData.changePercent24h)} (24h)
          </div>
        </CardContent>
      </Card>

      {/* 24h Volume */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBTC(marketData.volume24h)}</div>
          <div className="text-sm text-muted-foreground">
            {formatLargeNumber(marketData.volume24h * marketData.price)}
          </div>
        </CardContent>
      </Card>

      {/* Open Interest */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Interest</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBTC(marketData.openInterest)}</div>
          <div className="text-sm text-muted-foreground">
            {formatLargeNumber(marketData.openInterest * marketData.price)}
          </div>
        </CardContent>
      </Card>

      {/* Funding Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Funding Rate</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getFundingRateColor(marketData.fundingRate)}`}>
            {formatPercentage(marketData.fundingRate)}
          </div>
          <div className="text-sm text-muted-foreground">Next: {formatTime(marketData.nextFundingTime)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
