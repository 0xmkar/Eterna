import { TradingViewChart } from "@/components/trading-view-chart"
import { OrderBook } from "@/components/order-book"
import { TradingPanel } from "@/components/trading-panel"
import { WalletConnect } from "@/components/wallet-connect"
import { RootstockLogo } from "@/components/rootstock-logo"
import { PriceTicker } from "@/components/price-ticker"
import { MarketStats } from "@/components/market-stats"
import { LiquidationFeed } from "@/components/liquidation-feed"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TradePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="flex items-center gap-3">
                <RootstockLogo className="w-8 h-8" />
                <div>
                  <h1 className="text-lg font-bold">Trading</h1>
                  <p className="text-sm text-muted-foreground">BTC Perpetual Futures</p>
                </div>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Price Ticker */}
      <PriceTicker />

      {/* Market Stats */}
      <div className="container mx-auto px-4 py-4">
        <MarketStats />
      </div>

      {/* Trading Interface */}
      <main className="container mx-auto px-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
          {/* Chart - Takes up most space */}
          <div className="lg:col-span-2">
            <TradingViewChart theme="light" height={600} />
          </div>

          {/* Order Book */}
          <div className="lg:col-span-1">
            <OrderBook />
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <TradingPanel currentPrice={52150} userBalance={1.5} />
          </div>

          {/* Liquidation Feed - Full width below */}
          <div className="lg:col-span-4">
            <LiquidationFeed />
          </div>
        </div>
      </main>
    </div>
  )
}
