"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { TrendingUp, TrendingDown, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ethers } from 'ethers'
import PerpMarketABI from '@/abi/DDexRBTC.json'

interface TradingPanelProps {
  currentPrice?: number
  userBalance?: number
}

const NEXT_PERP_MARKET_ADDRESS = "0x4891151643A2532117CdA0ADA32D518211b92475"

export function TradingPanel({ currentPrice = 52000, userBalance = 0 }: TradingPanelProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [side, setSide] = useState<"long" | "short">("long")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState(currentPrice.toString())
  const [leverage, setLeverage] = useState([10])
  const { toast } = useToast()

  const calculateMargin = () => {
    const sizeNum = Number.parseFloat(size) || 0
    const leverageNum = leverage[0]
    return sizeNum / leverageNum
  }

  const calculateFee = () => {
    const sizeNum = Number.parseFloat(size) || 0
    return sizeNum * 0.001 // 0.1% trading fee
  }

  const calculateLiquidationPrice = () => {
    const sizeNum = Number.parseFloat(size) || 0
    const leverageNum = leverage[0]
    const margin = calculateMargin()
    const maintenanceMargin = margin * 0.1 // 10% maintenance margin

    if (side === "long") {
      return currentPrice - (maintenanceMargin / sizeNum) * currentPrice
    } else {
      return currentPrice + (maintenanceMargin / sizeNum) * currentPrice
    }
  }

  const handleSubmitOrder = async () => {    
    if (!size || Number.parseFloat(size) <= 0) {
      toast({
        title: "Invalid size",
        description: "Please enter a valid position size",
        variant: "destructive",
      })
      return
    }
  
    const requiredMargin = calculateMargin() + calculateFee()
    if (requiredMargin > userBalance) {
      toast({
        title: "Insufficient balance",
        description: `Required: ${requiredMargin.toFixed(4)} rBTC, Available: ${userBalance.toFixed(4)} rBTC`,
        variant: "destructive",
      })
      return
    }
  
    try {
      // Check if wallet is connected
      if (!window.ethereum) {
        toast({
          title: "Wallet not found",
          description: "Please install a Web3 wallet",
          variant: "destructive",
        })
        return
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      const perpMarketContract = new ethers.Contract(
        NEXT_PERP_MARKET_ADDRESS as string,
        PerpMarketABI.abi,
        signer
      )

      // Convert size to wei (assuming size is in BTC, convert to 18 decimals)
      const sizeInWei = ethers.parseEther(size.toString())

      // Determine if it's a long position (assuming 'side' variable: 'long' or 'short')
      const isLong = side.toLowerCase() == 'long'
      // Convert required margin to wei (rBTC has 18 decimals)
      const totalRequiredInWei = ethers.parseEther(requiredMargin.toString())
  
      // Show loading toast
      toast({
        title: "Submitting order",
        description: "Please confirm the transaction in your wallet",
      })
  
      // Call the smart contract function
      const tx = await perpMarketContract.openPosition(
        isLong,
        sizeInWei,
        {
          value: totalRequiredInWei, // Send rBTC as msg.value
          gasLimit: 500000, // Adjust gas limit as needed
        }
      )
  
      // Show transaction submitted toast
      toast({
        title: "Transaction submitted",
        description: `Transaction hash: ${tx.hash}`,
      })
  
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      console.log("Transaction confirmed:", receipt)
  
      // Success toast
      toast({
        title: "Order submitted successfully",
        description: `${side.toUpperCase()} ${size} BTC at ${leverage[0]}x leverage`,
      })

      // Reset form
      setSize("")
      setPrice(currentPrice.toString())
  
    } catch (error) {
      console.error("Error submitting order:", error)
      
      // Handle different types of errors
      let errorMessage = "An error occurred while submitting the order"
      
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user"
      } else if (error.code === -32603) {
        errorMessage = "Transaction failed - please check your balance and try again"
      } else if (error.message.includes("ZeroAmount")) {
        errorMessage = "Invalid amount - size must be greater than 0"
      } else if (error.message.includes("InsufficientMargin")) {
        errorMessage = "Insufficient margin for this trade"
      } else if (error.message.includes("InvalidLeverage")) {
        errorMessage = "Leverage exceeds maximum allowed"
      } else if (error.message.includes("InvalidPrice")) {
        errorMessage = "Invalid price - please try again"
      }
  
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade BTC-PERP</span>
          <Badge variant="outline" className="text-xs">
            Max 50x
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Type Tabs */}
        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "market" | "limit")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Side Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === "long" ? "default" : "outline"}
            onClick={() => setSide("long")}
            className={side === "long" ? "bg-long hover:bg-long/90 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Long
          </Button>
          <Button
            variant={side === "short" ? "default" : "outline"}
            onClick={() => setSide("short")}
            className={side === "short" ? "bg-short hover:bg-short/90 text-white" : ""}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Short
          </Button>
        </div>

        {/* Price Input (for limit orders) */}
        {orderType === "limit" && (
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>
        )}

        {/* Size Input */}
        <div className="space-y-2">
          <Label htmlFor="size">Size (BTC)</Label>
          <Input
            id="size"
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Enter size"
            step="0.001"
          />
        </div>

        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Leverage</Label>
            <Badge variant="secondary">{leverage[0]}x</Badge>
          </div>
          <Slider value={leverage} onValueChange={setLeverage} max={50} min={1} step={1} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
          </div>
        </div>

        {/* Order Summary */}
        {size && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Order Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Required Margin:</span>
              <span className="text-right font-mono">{calculateMargin().toFixed(4)} rBTC</span>
              <span className="text-muted-foreground">Trading Fee:</span>
              <span className="text-right font-mono">{calculateFee().toFixed(4)} rBTC</span>
              <span className="text-muted-foreground">Liquidation Price:</span>
              <span className="text-right font-mono">${calculateLiquidationPrice().toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmitOrder}
          className={`w-full ${
            side === "long" ? "bg-long hover:bg-long/90 text-white" : "bg-short hover:bg-short/90 text-white"
          }`}
          disabled={!size}
        >
          {side === "long" ? "Open Long Position" : "Open Short Position"}
        </Button>

        {/* Balance Info */}
        <div className="text-xs text-muted-foreground text-center">
          Available Balance: {userBalance.toFixed(4)} rBTC
        </div>
      </CardContent>
    </Card>
  )
}
