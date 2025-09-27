import { WalletConnect } from "@/components/wallet-connect"
import { RootstockLogo } from "@/components/rootstock-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Zap, BarChart3, Wallet } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RootstockLogo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-balance">RootStock Perpetuals</h1>
                <p className="text-sm text-muted-foreground">Decentralized Futures Trading</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/margin">
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit/Withdrawal
                </Link>
              </Button>
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

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Powered by RootStock Testnet
          </Badge>
          <h2 className="text-4xl font-bold text-balance mb-4">Trade Bitcoin Perpetual Futures</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Experience high-leverage Bitcoin trading with native rBTC collateral on RootStock
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                High Leverage
              </CardTitle>
              <CardDescription>Trade with up to 50x leverage on Bitcoin perpetual futures</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Maximum 50x leverage</li>
                <li>• 20% initial margin requirement</li>
                <li>• 5% maintenance margin</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Native rBTC
              </CardTitle>
              <CardDescription>Use native Bitcoin as collateral with no wrapping required</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Native rBTC collateral</li>
                <li>• No token wrapping</li>
                <li>• Direct Bitcoin settlement</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Low Fees
              </CardTitle>
              <CardDescription>Competitive trading fees with transparent pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 0.1% trading fee</li>
                <li>• 5% liquidation reward</li>
                <li>• No hidden costs</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Ready to Start Trading?</CardTitle>
              <CardDescription>Connect your wallet to access the trading interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <WalletConnect />
              <div className="grid grid-cols-3 gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/trade">Trade</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/margin">Deposit/Withdrawal</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
