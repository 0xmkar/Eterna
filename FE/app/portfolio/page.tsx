import { PortfolioSummary } from "@/components/portfolio-summary"
import { PositionsTable } from "@/components/positions-table"
import { TradeHistory } from "@/components/trade-history"
import { FundingHistory } from "@/components/funding-history"
import { WalletConnect } from "@/components/wallet-connect"
import { RootstockLogo } from "@/components/rootstock-logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function PortfolioPage() {
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
                  <h1 className="text-lg font-bold">Portfolio</h1>
                  <p className="text-sm text-muted-foreground">Manage your positions and view performance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/trade">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Trade
                </Link>
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Portfolio Summary */}
        <PortfolioSummary />

        {/* Open Positions */}
        <PositionsTable />

        {/* History Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradeHistory />
          <FundingHistory />
        </div>
      </main>
    </div>
  )
}
