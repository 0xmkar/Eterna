"use client"

import { MarginManagement } from "@/components/margin-management"
import { WalletConnect } from "@/components/wallet-connect"
import { RootstockLogo } from "@/components/rootstock-logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Wallet } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/components/wallet-context"

export default function MarginPage() {
  const { wallet } = useWallet()
  
  // Convert wallet balance from string to number, fallback to 0 if not connected
  const userBalance = wallet.isConnected && wallet.balance ? parseFloat(wallet.balance) : 0
  console.log(wallet.isConnected, wallet.balance, parseFloat(wallet?.balance || '0'))

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
                  <h1 className="text-lg font-bold">Margin Management</h1>
                  <p className="text-sm text-muted-foreground">Manage your collateral and margin requirements</p>
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

      {/* Margin Management Content */}
      <main className="container mx-auto px-4 py-6">
        <MarginManagement 
          userBalance={userBalance} 
          availableMargin={0} 
          usedMargin={0} 
          marginUtilization={0} 
        />
      </main>
    </div>
  )
}
