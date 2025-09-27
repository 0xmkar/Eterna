"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus, Minus, Wallet, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ethers } from "ethers"
import { createContractInstance } from "@/lib/utils"

interface MarginManagementProps {
  userBalance?: number
  availableMargin?: number
  usedMargin?: number
  marginUtilization?: number
}

export function MarginManagement({
  userBalance = 2.5,
  availableMargin = 0.942,
  marginUtilization = 62.3,
}: MarginManagementProps) {
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const formatBTC = (value: number) => value != 0 ? `${value.toFixed(6)} BTC` : "Connect your wallet"
  const formatUSD = (value: number, btcPrice = 109751) => `$${(value * btcPrice).toLocaleString()}`

  const handleDeposit = async () => {
    const amount = Number.parseFloat(depositAmount)
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      })
      return
    }
    
    setIsProcessing(true)
    try {
      let ddexRBTCContract = await createContractInstance()
      const amountInWei = ethers.parseEther(amount.toString())
      
      // The contract accepts rBTC via the deposit() function with msg.value
      const tx = await ddexRBTCContract.deposit({
        value: amountInWei,
        gasLimit: 100000
      })
      await tx.wait()
      
      toast({
        title: "Deposit successful",
        description: `Deposited ${formatBTC(amount)} rBTC to DDex`,
      })
      setDepositAmount("")
      
      // Optionally refresh balance after deposit
      // await refreshBalance()
      
    } catch (error) {
      console.error("Deposit error:", error)
      
      // Handle specific error cases
      let errorMessage = "Failed to deposit funds to DDex"
      
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user"
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient rBTC balance"
      } else if (error.message.includes("Must deposit more than 0")) {
        errorMessage = "Amount must be greater than 0"
      }
      
      toast({
        title: "Deposit failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      })
      return
    }
  
    if (amount > availableMargin) {
      toast({
        title: "Insufficient funds",
        description: `Available balance: ${formatBTC(availableMargin)}`,
        variant: "destructive",
      })
      return
    }
  
    setIsProcessing(true)
    try {
      let ddexRBTCContract = await createContractInstance()
      const amountInWei = ethers.parseEther(amount.toString())
      
      // Calculate the withdrawal fee to show user total cost
      const withdrawalFee = await ddexRBTCContract.calculateWithdrawalFee(amountInWei)
      const totalRequired = amountInWei + withdrawalFee
      const totalRequiredInBTC = Number.parseFloat(ethers.formatEther(totalRequired))
      
      // Check if user has enough balance including fees
      if (totalRequiredInBTC > availableMargin) {
        toast({
          title: "Insufficient funds",
          description: `Total required (including ${formatBTC(Number.parseFloat(ethers.formatEther(withdrawalFee)))} fee): ${formatBTC(totalRequiredInBTC)}`,
          variant: "destructive",
        })
        return
      }
      
      // Call the withdraw function of DDexRBTC contract
      const tx = await ddexRBTCContract.withdraw(amountInWei, {
        gasLimit: 150000
      })
      
      await tx.wait()
  
      toast({
        title: "Withdrawal successful",
        description: `Withdrew ${formatBTC(amount)} rBTC from DDex (Fee: ${formatBTC(Number.parseFloat(ethers.formatEther(withdrawalFee)))})`,
      })
      setWithdrawAmount("")      
    } catch (error) {
      console.error("Withdrawal error:", error)
      
      let errorMessage = "Failed to withdraw funds from DDex"
      
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user"
      } else if (error.message.includes("Insufficient balance including fee")) {
        errorMessage = "Insufficient balance to cover withdrawal and fees"
      } else if (error.message.includes("Amount must be greater than 0")) {
        errorMessage = "Withdrawal amount must be greater than 0"
      } else if (error.message.includes("Contract has insufficient rBTC")) {
        errorMessage = "Contract has insufficient rBTC for withdrawal"
      } else if (error.message.includes("rBTC transfer failed")) {
        errorMessage = "Failed to transfer rBTC to your wallet"
      }
      
      toast({
        title: "Withdrawal failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  return (
    <div className="space-y-6">
      {/* Margin Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Margin Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Total Balance</Label>
              <div className="text-2xl font-bold">{formatBTC(userBalance)}</div>
              <div className="text-sm text-muted-foreground">{formatUSD(userBalance)}</div>
            </div>
          </div>

          {marginUtilization >= 80 && (
            <div className="mt-4 p-3 bg-short/10 border border-short/20 rounded-lg">
              <div className="flex items-center gap-2 text-short">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">High Risk Warning</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your margin utilization is high. Consider adding more margin or reducing position sizes to avoid
                liquidation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit/Withdraw Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Manage Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center gap-2">
                <Minus className="w-4 h-4" />
                Withdraw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Deposit Amount (rBTC)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.000000"
                  step="0.000001"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Wallet Balance: {formatBTC(userBalance)}</span>
                  {depositAmount && <span>≈ {formatUSD(Number.parseFloat(depositAmount) || 0)}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDepositAmount((userBalance * 0.25).toFixed(6))}>
                  25%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositAmount((userBalance * 0.5).toFixed(6))}>
                  50%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositAmount((userBalance * 0.75).toFixed(6))}>
                  75%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositAmount(userBalance.toFixed(6))}>
                  Max
                </Button>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || isProcessing}
                className="w-full bg-long hover:bg-long/90 text-white"
              >
                {isProcessing ? "Processing..." : "Deposit to Margin Vault"}
              </Button>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Withdraw Amount (rBTC)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.000000"
                  step="0.000001"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available: {formatBTC(availableMargin)}</span>
                  {withdrawAmount && <span>≈ {formatUSD(Number.parseFloat(withdrawAmount) || 0)}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount((availableMargin * 0.25).toFixed(6))}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount((availableMargin * 0.5).toFixed(6))}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount((availableMargin * 0.75).toFixed(6))}
                >
                  75%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(availableMargin.toFixed(6))}>
                  Max
                </Button>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isProcessing}
                className="w-full bg-short hover:bg-short/90 text-white"
              >
                {isProcessing ? "Processing..." : "Withdraw from Margin Vault"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Margin Requirements Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Margin Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Initial Margin</span>
                <Badge variant="outline">20% (2000 bps)</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Maintenance Margin</span>
                <Badge variant="outline">10% (1000 bps)</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trading Fee</span>
                <Badge variant="outline">0.1% (10 bps)</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Liquidation Reward</span>
                <Badge variant="outline">5% (500 bps)</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Leverage</span>
                <Badge variant="outline">50x</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Collateral</span>
                <Badge variant="outline">Native rBTC</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
