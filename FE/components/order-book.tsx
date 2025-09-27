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

interface RawOrder {
  id: number
  user_id: number
  side: string
  price: number | string | null
  quantity: number | string
  leverage: number | string
  margin: number | string
  max_slippage_bps: number
  status: string
  created_at: string
  updated_at: string
  wallet_address?: string
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

  // Process raw orders into order book format
  const processOrdersToOrderBook = (orders: RawOrder[]) => {
    console.log('Raw orders received:', orders.length)
    
    // Filter open orders with prices and convert strings to numbers
    const openOrders = orders.filter(order => 
      order.status === 'OPEN' && 
      order.price !== null && 
      order.price !== undefined &&
      (typeof order.price === 'number' ? order.price > 0 : parseFloat(order.price) > 0)
    ).map(order => ({
      ...order,
      price: typeof order.price === 'string' ? parseFloat(order.price) : order.price,
      quantity: typeof order.quantity === 'string' ? parseFloat(order.quantity) : order.quantity
    }))
    
    console.log('Orders with prices:', openOrders.length)

    // Group buy orders (bids)
    const buyOrders = openOrders.filter(order => 
      order.side === 'BUY' || order.side === 'LONG'
    )
    
    // Group sell orders (asks)  
    const sellOrders = openOrders.filter(order =>
      order.side === 'SELL' || order.side === 'SHORT'
    )

    console.log('Buy orders:', buyOrders.length, 'Sell orders:', sellOrders.length)

    // Aggregate bids by price
    const bidMap = new Map<number, number>()
    buyOrders.forEach(order => {
      const price = order.price as number
      const currentSize = bidMap.get(price) || 0
      bidMap.set(price, currentSize + order.quantity)
    })

    // Aggregate asks by price
    const askMap = new Map<number, number>()
    sellOrders.forEach(order => {
      const price = order.price as number
      const currentSize = askMap.get(price) || 0
      askMap.set(price, currentSize + order.quantity)
    })

    // Convert to arrays and sort
    const bidsArray = Array.from(bidMap.entries())
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => b.price - a.price) // Highest price first
      .slice(0, 10) // Top 10 bids

    const asksArray = Array.from(askMap.entries())
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => a.price - b.price) // Lowest price first
      .slice(0, 10) // Top 10 asks

    // Calculate running totals
    let bidTotal = 0
    const bids = bidsArray.map(bid => {
      bidTotal += bid.size
      return {
        price: bid.price,
        size: bid.size,
        total: bidTotal
      }
    })

    let askTotal = 0
    const asks = asksArray.map(ask => {
      askTotal += ask.size
      return {
        price: ask.price,
        size: ask.size,
        total: askTotal
      }
    })

    // Calculate spread and last price
    const bestBid = bids.length > 0 ? bids[0].price : 0
    const bestAsk = asks.length > 0 ? asks[0].price : 0
    const spread = bestAsk && bestBid ? bestAsk - bestBid : 0
    
    // Get last filled order price or use mid price as fallback
    const filledOrders = orders.filter(order => 
      order.status === 'FILLED' && 
      order.price !== null
    ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    
    const lastPrice = filledOrders.length > 0 
      ? (typeof filledOrders[0].price === 'string' ? parseFloat(filledOrders[0].price!) : filledOrders[0].price!)
      : (bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 52000) // fallback

    console.log('Processed order book:', { bids: bids.length, asks: asks.length, spread, lastPrice })

    return {
      bids,
      asks,
      spread,
      lastPrice
    }
  }

  // Fetch order book data from backend
  const fetchOrderBook = async () => {
    try {
      const response = await fetch('http://localhost:3001/orders/')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        const processedOrderBook = processOrdersToOrderBook(result.data)
        setOrderBook(processedOrderBook)
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch orders')
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

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
  }
  
  const formatSize = (size: number | string) => {
    const numSize = typeof size === 'string' ? parseFloat(size) : size
    return isNaN(numSize) ? '0.0000' : numSize.toFixed(4)
  }

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
            <div className="px-4 py-8 text-xs text-muted-foreground text-center">
              <div className="font-medium mb-1">No limit sell orders</div>
              <div className="text-xs opacity-75">Only market orders found in database</div>
            </div>
          )}
        </div>

        {/* Spread indicator */}
        <div className="px-4 py-2 bg-muted/30 border-y">
          <div className="text-center text-xs text-muted-foreground">
            {orderBook.spread > 0 ? `Spread: $${formatPrice(orderBook.spread)}` : 'No spread (no limit orders)'}
          </div>
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
            <div className="px-4 py-8 text-xs text-muted-foreground text-center">
              <div className="font-medium mb-1">No limit buy orders</div>
              <div className="text-xs opacity-75">Only market orders found in database</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
