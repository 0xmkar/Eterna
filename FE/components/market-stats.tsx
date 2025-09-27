"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Users, Clock, DollarSign } from "lucide-react"
import { useBTCPriceWithHistory } from "@/hooks/useBTCPrice"

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
  const {
    price: btcPrice,
    loading: priceLoading,
    error: priceError,
    change24h,
    changePercent24h,
    volume24h
  } = useBTCPriceWithHistory()

  const [marketData, setMarketData] = useState<MarketData>({
    price: 0,
    change24h: 0,
    changePercent24h: 0,
    volume24h: 0,
    openInterest: 892.34,
    fundingRate: 0.0125,
    nextFundingTime: Date.now() + 2 * 60 * 60 * 1000 + 34 * 60 * 1000, // 2h 34m from now
    longShortRatio: 1.23,
    totalLongs: 490.45,
    totalShorts: 401.89,
    indexPrice: 0,
    markPrice: 0,
  })
  
  const [formattedTime, setFormattedTime] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  // Update market data when BTC price changes
  useEffect(() => {
    if (btcPrice > 0) {
      setMarketData((prev) => ({
        ...prev,
        price: btcPrice,
        change24h: change24h,
        changePercent24h: changePercent24h,
        volume24h: volume24h,
        indexPrice: btcPrice * 0.9999, // Slight difference for index price
        markPrice: btcPrice * 1.0001, // Slight difference for mark price
      }))
    }
  }, [btcPrice, change24h, changePercent24h, volume24h])

  // Simulate real-time updates for non-price data
  useEffect(() => {
    setIsClient(true)
    
    const interval = setInterval(() => {
      setMarketData((prev) => ({
        ...prev,
        openInterest: prev.openInterest + (Math.random() - 0.5) * 5,
        longShortRatio: Math.max(0.1, prev.longShortRatio + (Math.random() - 0.5) * 0.1),
        totalLongs: Math.max(0, prev.totalLongs + (Math.random() - 0.5) * 10),
        totalShorts: Math.max(0, prev.totalShorts + (Math.random() - 0.5) * 10),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Update formatted time every minute to prevent hydration issues
  useEffect(() => {
    if (!isClient) return
    
    const updateTime = () => {
      const diff = marketData.nextFundingTime - Date.now()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setFormattedTime(`${hours}h ${minutes}m`)
    }
    
    updateTime() // Initial update
    const interval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [marketData.nextFundingTime, isClient])

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
          <div className="text-sm text-muted-foreground">Next: {formattedTime}</div>
        </CardContent>
      </Card>
    </div>
  )
}
