"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, TrendingUp, TrendingDown, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Position {
  id: string
  symbol: string
  side: "long" | "short"
  size: number
  entryPrice: number
  markPrice: number
  margin: number
  leverage: number
  pnl: number
  pnlPercentage: number
  liquidationPrice: number
  marginRatio: number
  timestamp: number
}

export function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([])
  const { toast } = useToast()

  // Mock positions data
  useEffect(() => {
    const mockPositions: Position[] = [
      {
        id: "1",
        symbol: "BTC-PERP",
        side: "long",
        size: 0.5,
        entryPrice: 51800,
        markPrice: 52150,
        margin: 1.036,
        leverage: 25,
        pnl: 0.00337,
        pnlPercentage: 0.675,
        liquidationPrice: 49742,
        marginRatio: 0.15,
        timestamp: Date.now() - 3600000,
      },
      {
        id: "2",
        symbol: "BTC-PERP",
        side: "short",
        size: 0.25,
        entryPrice: 52300,
        markPrice: 52150,
        margin: 0.522,
        leverage: 20,
        pnl: 0.00072,
        pnlPercentage: 0.287,
        liquidationPrice: 54615,
        marginRatio: 0.18,
        timestamp: Date.now() - 1800000,
      },
    ]
    setPositions(mockPositions)
  }, [])

  const handleClosePosition = async (positionId: string) => {
    const position = positions.find((p) => p.id === positionId)
    if (!position) return

    // Here you would integrate with the smart contract
    toast({
      title: "Position closed",
      description: `Closed ${position.side} position for ${position.symbol}`,
    })

    setPositions((prev) => prev.filter((p) => p.id !== positionId))
  }

  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const formatBTC = (value: number) => {
    return `${value.toFixed(6)} BTC`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "text-long" : "text-short"
  }

  const getMarginRatioColor = (ratio: number) => {
    if (ratio <= 0.1) return "text-short"
    if (ratio <= 0.15) return "text-yellow-500"
    return "text-long"
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No open positions</p>
            <p className="text-sm">Open your first position to start trading</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Open Positions</CardTitle>
          <Badge variant="secondary">
            {positions.length} position{positions.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Mark Price</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Margin Ratio</TableHead>
                <TableHead>Liq. Price</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={position.side === "long" ? "text-long border-long/50" : "text-short border-short/50"}
                    >
                      {position.side === "long" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {position.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatBTC(position.size)}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(position.entryPrice)}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(position.markPrice)}</TableCell>
                  <TableCell>
                    <div className={`font-mono ${getPnLColor(position.pnl)}`}>
                      {formatBTC(position.pnl)}
                      <div className="text-xs">{formatPercentage(position.pnlPercentage)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatBTC(position.margin)}
                    <div className="text-xs text-muted-foreground">{position.leverage}x</div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-mono ${getMarginRatioColor(position.marginRatio)}`}>
                      {formatPercentage(position.marginRatio * 100)}
                      {position.marginRatio <= 0.12 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(position.liquidationPrice)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatTime(position.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClosePosition(position.id)}
                      className="text-short hover:text-short hover:bg-short/10"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Close
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
