"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Copy, ExternalLink, LogOut, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/components/wallet-context"

export function WalletConnect() {
  const { wallet, connectWallet, disconnectWallet, isConnecting, switchAccount } = useWallet()
  const { toast } = useToast()

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleAccountSwitch = (value: string) => {
    const index = parseInt(value)
    switchAccount(index)
  }

  if (!wallet.isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Connected</span>
            {wallet.allAccounts.length > 1 && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {wallet.allAccounts.length}
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {wallet.chainId === 31 ? "RootStock Testnet" : `Chain ${wallet.chainId}`}
          </Badge>
        </div>

        {/* Account Selector - only show if multiple accounts */}
        {wallet.allAccounts.length > 1 && (
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">Account</label>
            <Select value={wallet.selectedAccountIndex.toString()} onValueChange={handleAccountSwitch}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wallet.allAccounts.map((account, index) => (
                  <SelectItem key={account} value={index.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatAddress(account)}</span>
                      {index === wallet.selectedAccountIndex && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono">{formatAddress(wallet.address!)}</span>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-sm font-mono">{wallet.balance} rBTC</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={disconnectWallet} className="flex-1 bg-transparent">
            <LogOut className="w-3 h-3 mr-1" />
            Disconnect
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://rootstock-testnet.blockscout.com/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
