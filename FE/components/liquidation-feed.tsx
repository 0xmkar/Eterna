"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

interface LiquidationEvent {
  id: string
  timestamp: number
  side: "long" | "short"
  size: number
  price: number
  value: number
}

export function LiquidationFeed() {
  const [liquidations, setLiquidations] = useState<LiquidationEvent[]>([])

  useEffect(() => {
    // Generate initial liquidation events
    const generateLiquidation = (): LiquidationEvent => ({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now() - Math.random() * 3600000,
      side: Math.random() > 0.5 ? "long" : "short",
      size: Math.random() * 5 + 0.1,
      price: 52000 + (Math.random() - 0.5) * 2000,
      value: 0,
    })

    const initialLiquidations = Array.from({ length: 10 }, generateLiquidation)
      .map((liq) => ({ ...liq, value: liq.size * liq.price }))
      .sort((a, b) => b.timestamp - a.timestamp)

    setLiquidations(initialLiquidations)

    // Add new liquidations periodically
    const interval = setInterval(() => {
      const newLiquidation = generateLiquidation()
      newLiquidation.value = newLiquidation.size * newLiquidation.price
      newLiquidation.timestamp = Date.now()

      setLiquidations((prev) => [newLiquidation, ...prev.slice(0, 19)]) // Keep only 20 most recent
    }, 15000) // New liquidation every 15 seconds

    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  const formatBTC = (value: number) => `${value.toFixed(4)} BTC`
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-short" />
            Liquidations
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Live Feed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-2 p-4">
            {liquidations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent liquidations</p>
                <p className="text-sm">Liquidation events will appear here</p>
              </div>
            ) : (
              liquidations.map((liquidation) => (
                <div
                  key={liquidation.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        liquidation.side === "long" ? "text-long border-long/50" : "text-short border-short/50"
                      }
                    >
                      {liquidation.side === "long" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {liquidation.side.toUpperCase()}
                    </Badge>
                    <div className="text-sm">
                      <div className="font-mono">{formatBTC(liquidation.size)}</div>
                      <div className="text-xs text-muted-foreground">@ {formatCurrency(liquidation.price)}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-mono text-short">{formatCurrency(liquidation.value)}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(liquidation.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
