"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useBTCPriceWithHistory } from "@/hooks/useBTCPrice"

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
  const {
    price,
    loading,
    error,
    change24h,
    changePercent24h,
    high24h,
    low24h,
    volume24h
  } = useBTCPriceWithHistory()

  const priceData: PriceData = {
    symbol: "BTC-USD",
    price: price,
    change24h: change24h,
    changePercent24h: changePercent24h,
    high24h: high24h,
    low24h: low24h,
    volume24h: volume24h,
  }

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

  if (loading) {
    return (
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">BTC-USD</h2>
                <Badge variant="outline" className="text-xs">PERP</Badge>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">BTC-USD</h2>
                <Badge variant="destructive" className="text-xs">ERROR</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Failed to load price</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Main Price */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{priceData.symbol}</h2>
              <Badge variant="outline" className="text-xs">
                USD
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
