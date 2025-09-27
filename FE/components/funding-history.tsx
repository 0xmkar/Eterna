"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"

interface FundingRecord {
  timestamp: number
  rate: number
  payment: number
  position: "long" | "short" | null
}

export function FundingHistory() {
  const [fundingHistory, setFundingHistory] = useState<FundingRecord[]>([])

  useEffect(() => {
    // Mock funding history data
    const mockHistory: FundingRecord[] = [
      {
        timestamp: Date.now() - 8 * 60 * 60 * 1000,
        rate: 0.0125,
        payment: 0.000032,
        position: "long",
      },
      {
        timestamp: Date.now() - 16 * 60 * 60 * 1000,
        rate: 0.0089,
        payment: 0.000023,
        position: "long",
      },
      {
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        rate: -0.0045,
        payment: -0.000012,
        position: "short",
      },
      {
        timestamp: Date.now() - 32 * 60 * 60 * 1000,
        rate: 0.0156,
        payment: 0.000041,
        position: "long",
      },
      {
        timestamp: Date.now() - 40 * 60 * 60 * 1000,
        rate: 0.0098,
        payment: 0.000026,
        position: "long",
      },
    ]
    setFundingHistory(mockHistory)
  }, [])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(4)}%`
  const formatBTC = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(6)} BTC`

  const getRateColor = (rate: number) => (rate >= 0 ? "text-long" : "text-short")
  const getPaymentColor = (payment: number) => (payment >= 0 ? "text-long" : "text-short")

  if (fundingHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funding History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No funding history</p>
            <p className="text-sm">Funding payments will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Funding History</CardTitle>
          <Badge variant="secondary">{fundingHistory.length} records</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Funding Rate</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundingHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs text-muted-foreground">{formatTime(record.timestamp)}</TableCell>
                  <TableCell>
                    {record.position ? (
                      <Badge
                        variant="outline"
                        className={
                          record.position === "long" ? "text-long border-long/50" : "text-short border-short/50"
                        }
                      >
                        {record.position === "long" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {record.position.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className={`font-mono ${getRateColor(record.rate)}`}>
                    {formatPercentage(record.rate)}
                  </TableCell>
                  <TableCell className={`font-mono ${getPaymentColor(record.payment)}`}>
                    {formatBTC(record.payment)}
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
