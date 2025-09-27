"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

declare global {
  interface Window {
    TradingView: any
  }
}

interface TradingViewChartProps {
  symbol?: string
  theme?: "light" | "dark"
  height?: number
}

export function TradingViewChart({ symbol = "BTCUSD", theme = "light", height = 500 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // Load TradingView script
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          locale: "en",
          toolbar_bg: theme === "dark" ? "#1a1a1a" : "#ffffff",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies"],
          overrides: {
            "paneProperties.background": theme === "dark" ? "#0f0f0f" : "#ffffff",
            "paneProperties.vertGridProperties.color": theme === "dark" ? "#2a2a2a" : "#e1e1e1",
            "paneProperties.horzGridProperties.color": theme === "dark" ? "#2a2a2a" : "#e1e1e1",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": theme === "dark" ? "#d1d4dc" : "#131722",
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
          },
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove()
      }
    }
  }, [symbol, theme])

  return (
    <Card className="p-0 overflow-hidden">
      <div
        ref={containerRef}
        id={`tradingview-chart-${Math.random().toString(36).substr(2, 9)}`}
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </Card>
  )
}
