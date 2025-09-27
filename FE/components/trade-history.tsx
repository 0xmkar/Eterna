"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"

interface TradeHistory {
  id: string
  symbol: string
  side: "long" | "short"
  type: "open" | "close" | "liquidation"
  size: number
  price: number
  pnl?: number
  fee: number
  timestamp: number
}

export function TradeHistory() {
  const [trades, setTrades] = useState<TradeHistory[]>([])

  useEffect(() => {
    const mockTrades: TradeHistory[] = [
      {
        id: "1",
        symbol: "BTC-PERP",
        side: "long",
        type: "open",
        size: 0.5,
        price: 51800,
        fee: 0.000259,
        timestamp: Date.now() - 3600000,
      },
      {
        id: "2",
        symbol: "BTC-PERP",
        side: "short",
        type: "open",
        size: 0.25,
        price: 52300,
        fee: 0.0001308,
        timestamp: Date.now() - 1800000,
      },
      {
        id: "3",
        symbol: "BTC-PERP",
        side: "long",
        type: "close",
        size: 0.3,
        price: 51950,
        pnl: 0.00087,
        fee: 0.0001559,
        timestamp: Date.now() - 900000,
      },
    ]
    setTrades(mockTrades)
  }, [])

  const formatBTC = (value: number) => `${value.toFixed(6)} BTC`
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "open":
        return "text-blue-500"
      case "close":
        return "text-green-500"
      case "liquidation":
        return "text-short"
      default:
        return "text-muted-foreground"
    }
  }

  const getPnLColor = (pnl?: number) => {
    if (pnl === undefined) return "text-muted-foreground"
    return pnl >= 0 ? "text-long" : "text-short"
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trade history</p>
            <p className="text-sm">Your completed trades will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trade History</CardTitle>
          <Badge variant="secondary">{trades.length} trades</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatTime(trade.timestamp)}</TableCell>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={trade.side === "long" ? "text-long border-long/50" : "text-short border-short/50"}
                    >
                      {trade.side === "long" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {trade.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(trade.type)}>
                      {trade.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatBTC(trade.size)}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(trade.price)}</TableCell>
                  <TableCell className={`font-mono ${getPnLColor(trade.pnl)}`}>
                    {trade.pnl !== undefined ? formatBTC(trade.pnl) : "-"}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{formatBTC(trade.fee)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
