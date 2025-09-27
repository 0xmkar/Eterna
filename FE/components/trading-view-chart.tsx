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
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    // Generate unique ID for this chart instance
    const chartId = `tradingview-chart-${Math.random().toString(36).substr(2, 9)}`
    
    // Load TradingView script
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    scriptRef.current = script
    
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        // Set the container ID
        containerRef.current.id = chartId
        
        try {
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
            container_id: chartId,
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
        } catch (error) {
          console.error("Error creating TradingView widget:", error)
        }
      }
    }
    
    script.onerror = () => {
      console.error("Failed to load TradingView script")
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup widget
      if (widgetRef.current) {
        try {
          // TradingView widget cleanup
          if (typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove()
          } else if (typeof widgetRef.current.destroy === 'function') {
            widgetRef.current.destroy()
          }
        } catch (error) {
          console.warn("Error cleaning up TradingView widget:", error)
        }
        widgetRef.current = null
      }
      
      // Clean up container content
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      
      // Remove script if it was added by this component
      if (scriptRef.current && scriptRef.current.parentNode) {
        try {
          scriptRef.current.parentNode.removeChild(scriptRef.current)
        } catch (error) {
          console.warn("Error removing TradingView script:", error)
        }
      }
    }
  }, [symbol, theme])

  return (
    <Card className="p-0 overflow-hidden">
      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </Card>
  )
}
