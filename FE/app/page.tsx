import { WalletConnect } from "@/components/wallet-connect"
import { RootstockLogo } from "@/components/rootstock-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Zap, BarChart3, Wallet, ArrowRight, Star, Users, DollarSign } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="border-b bg-card/70 backdrop-blur-xl relative z-10 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <RootstockLogo className="w-12 h-12 drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Eterna
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Perpetual Futures • RootStock</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" className="hover:scale-105 transition-transform">
                <Link href="/margin">
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit/Withdrawal
                </Link>
              </Button>
              <Button asChild variant="outline" className="hover:scale-105 transition-transform">
                <Link href="/trade">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Trade
                </Link>
              </Button>
              <div className="scale-110">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-lg py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Zap className="w-4 h-4 mr-2" />
              Powered by RootStock Testnet
            </Badge>
          </div>
          
          <h2 className="text-6xl font-bold text-balance mb-6 leading-tight">
            Trade Bitcoin
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Perpetual Futures
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience high-leverage Bitcoin trading with native rBTC collateral on RootStock.
            <br />
            <span className="font-semibold text-foreground">Trade smarter. Trade eternal.</span>
          </p>

          {/* Stats Row */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50x</div>
              <div className="text-sm text-muted-foreground">Max Leverage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">0.1%</div>
              <div className="text-sm text-muted-foreground">Trading Fee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <CardTitle className="text-xl">High Leverage Trading</CardTitle>
              <CardDescription className="text-base">Trade with up to 50x leverage on Bitcoin perpetual futures</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Maximum 50x leverage</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>20% initial margin requirement</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>5% maintenance margin</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <CardTitle className="text-xl">Native rBTC</CardTitle>
              <CardDescription className="text-base">Use native Bitcoin as collateral with no wrapping required</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Native rBTC collateral</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>No token wrapping</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Direct Bitcoin settlement</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Ultra-Low Fees</CardTitle>
              <CardDescription className="text-base">Competitive trading fees with transparent pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>0.1% trading fee</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>5% liquidation reward</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>No hidden costs</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl blur-3xl"></div>
          <Card className="max-w-2xl mx-auto relative bg-card/90 backdrop-blur-xl border-2 border-primary/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Ready to Start Trading?</CardTitle>
              <CardDescription className="text-lg">Connect your wallet and enter the future of Bitcoin perpetual trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="scale-110 flex justify-center">
                <WalletConnect />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform group">
                  <Link href="/trade">
                    Start Trading
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform group">
                  <Link href="/margin">
                    Manage Funds
                    <Wallet className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                By connecting, you agree to our terms of service and acknowledge the risks of leveraged trading
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}