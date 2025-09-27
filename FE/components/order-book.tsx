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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch order book data from backend
  const fetchOrderBook = async () => {
    try {
      const response = await fetch('http://localhost:3001/orders/orderbook')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setOrderBook(result.data)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch order book')
      }
    } catch (err) {
      console.error('Error fetching order book:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch order book')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and setup polling
  useEffect(() => {
    fetchOrderBook()
    
    // Poll every 1 second
    const interval = setInterval(fetchOrderBook, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => price.toFixed(2)
  const formatSize = (size: number) => size.toFixed(4)

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order Book</CardTitle>
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading order book...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order Book</CardTitle>
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-destructive">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

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
          {orderBook.asks.length > 0 ? (
            orderBook.asks
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
              ))
          ) : (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center">
              No sell orders
            </div>
          )}
        </div>

        {/* Spread indicator */}
        <div className="px-4 py-2 bg-muted/30 border-y">
          <div className="text-center text-xs text-muted-foreground">Spread: ${formatPrice(orderBook.spread)}</div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="max-h-48 overflow-y-auto">
          {orderBook.bids.length > 0 ? (
            orderBook.bids.map((bid, index) => (
              <div key={`bid-${index}`} className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-muted/50 relative">
                <div
                  className="absolute inset-y-0 right-0 bg-long/10"
                  style={{ width: `${(bid.total / Math.max(...orderBook.bids.map((b) => b.total))) * 100}%` }}
                />
                <span className="text-long font-mono relative z-10">{formatPrice(bid.price)}</span>
                <span className="text-right font-mono relative z-10">{formatSize(bid.size)}</span>
                <span className="text-right font-mono text-muted-foreground relative z-10">{formatSize(bid.total)}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center">
              No buy orders
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
