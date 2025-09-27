"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface OrderBookEntry {
  price: number
  size: number
  total: number
}

interface OrderBookProps {
  symbol?: string
}

export function OrderBook({ symbol = "BTC/USD" }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[]
    asks: OrderBookEntry[]
    spread: number
    lastPrice: number
  }>({
    bids: [],
    asks: [],
    spread: 0,
    lastPrice: 0,
  })

  // Mock data generation for demo
  useEffect(() => {
    const generateMockData = () => {
      const basePrice = 52000 + Math.random() * 1000
      const bids: OrderBookEntry[] = []
      const asks: OrderBookEntry[] = []

      // Generate bids (buy orders) - prices below market
      for (let i = 0; i < 10; i++) {
        const price = basePrice - (i + 1) * (Math.random() * 10 + 5)
        const size = Math.random() * 2 + 0.1
        const total = i === 0 ? size : bids[i - 1].total + size
        bids.push({ price, size, total })
      }

      // Generate asks (sell orders) - prices above market
      for (let i = 0; i < 10; i++) {
        const price = basePrice + (i + 1) * (Math.random() * 10 + 5)
        const size = Math.random() * 2 + 0.1
        const total = i === 0 ? size : asks[i - 1].total + size
        asks.push({ price, size, total })
      }

      const spread = asks[0]?.price - bids[0]?.price || 0

      setOrderBook({
        bids,
        asks,
        spread,
        lastPrice: basePrice,
      })
    }

    generateMockData()
    const interval = setInterval(generateMockData, 2000)

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => price.toFixed(2)
  const formatSize = (size: number) => size.toFixed(4)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Book</CardTitle>
          <Badge variant="outline" className="text-xs">
            {symbol}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Last: <span className="text-foreground font-mono">${formatPrice(orderBook.lastPrice)}</span>
          </span>
          <span className="text-muted-foreground">
            Spread: <span className="text-foreground font-mono">${formatPrice(orderBook.spread)}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
          <span>Price (USD)</span>
          <span className="text-right">Size (BTC)</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (Sell Orders) */}
        <div className="max-h-48 overflow-y-auto">
          {orderBook.asks
            .slice()
            .reverse()
            .map((ask, index) => (
              <div key={`ask-${index}`} className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-muted/50 relative">
                <div
                  className="absolute inset-y-0 right-0 bg-short/10"
                  style={{ width: `${(ask.total / Math.max(...orderBook.asks.map((a) => a.total))) * 100}%` }}
                />
                <span className="text-short font-mono relative z-10">{formatPrice(ask.price)}</span>
                <span className="text-right font-mono relative z-10">{formatSize(ask.size)}</span>
                <span className="text-right font-mono text-muted-foreground relative z-10">
                  {formatSize(ask.total)}
                </span>
              </div>
            ))}
        </div>

        {/* Spread indicator */}
        <div className="px-4 py-2 bg-muted/30 border-y">
          <div className="text-center text-xs text-muted-foreground">Spread: ${formatPrice(orderBook.spread)}</div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="max-h-48 overflow-y-auto">
          {orderBook.bids.map((bid, index) => (
            <div key={`bid-${index}`} className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-muted/50 relative">
              <div
                className="absolute inset-y-0 right-0 bg-long/10"
                style={{ width: `${(bid.total / Math.max(...orderBook.bids.map((b) => b.total))) * 100}%` }}
              />
              <span className="text-long font-mono relative z-10">{formatPrice(bid.price)}</span>
              <span className="text-right font-mono relative z-10">{formatSize(bid.size)}</span>
              <span className="text-right font-mono text-muted-foreground relative z-10">{formatSize(bid.total)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
