"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PriceData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
}

export function PriceTicker() {
  const [priceData, setPriceData] = useState<PriceData>({
    symbol: "BTC-USD",
    price: 52150,
    change24h: 1234.56,
    changePercent24h: 2.43,
    high24h: 53200,
    low24h: 50800,
    volume24h: 1234.56,
  })

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData((prev) => {
        const priceChange = (Math.random() - 0.5) * 50
        const newPrice = Math.max(prev.price + priceChange, 45000) // Minimum price floor

        return {
          ...prev,
          price: newPrice,
          change24h: prev.change24h + priceChange,
          changePercent24h: ((newPrice - (newPrice - prev.change24h)) / (newPrice - prev.change24h)) * 100,
          high24h: Math.max(prev.high24h, newPrice),
          low24h: Math.min(prev.low24h, newPrice),
          volume24h: prev.volume24h + Math.random() * 5,
        }
      })
    }, 2000)

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

  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  const formatBTC = (value: number) => `${value.toFixed(2)} BTC`

  const getPriceChangeColor = (change: number) => (change >= 0 ? "text-long" : "text-short")
  const getBadgeVariant = (change: number) => (change >= 0 ? "default" : "destructive")

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Main Price */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{priceData.symbol}</h2>
              <Badge variant="outline" className="text-xs">
                PERP
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{formatCurrency(priceData.price)}</span>
              <Badge variant={getBadgeVariant(priceData.changePercent24h)} className="flex items-center gap-1">
                {priceData.changePercent24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatPercentage(priceData.changePercent24h)}
              </Badge>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">24h High</span>
              <span className="font-mono">{formatCurrency(priceData.high24h)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">24h Low</span>
              <span className="font-mono">{formatCurrency(priceData.low24h)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">24h Volume</span>
              <span className="font-mono">{formatBTC(priceData.volume24h)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
