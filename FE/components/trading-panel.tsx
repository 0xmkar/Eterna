"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { TrendingUp, TrendingDown, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/components/wallet-context"
import { useBTCPrice } from "@/hooks/useBTCPrice"

interface TradingPanelProps {
  currentPrice?: number
  userBalance?: number
}

export function TradingPanel({ currentPrice = 109200, userBalance = 0 }: TradingPanelProps) {
  const { price: btcPrice, loading: priceLoading } = useBTCPrice()
  const actualCurrentPrice = btcPrice > 0 ? btcPrice : currentPrice
  
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [side, setSide] = useState<"buy" | "sell">("buy")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState(actualCurrentPrice.toString())
  const [leverage, setLeverage] = useState([10])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { wallet } = useWallet()

  // Update price input when BTC price changes
  useEffect(() => {
    if (btcPrice > 0) {
      setPrice(btcPrice.toString())
    }
  }, [btcPrice])

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

    if (side === "buy") {
      return actualCurrentPrice - (maintenanceMargin / sizeNum) * actualCurrentPrice
    } else {
      return actualCurrentPrice + (maintenanceMargin / sizeNum) * actualCurrentPrice
    }
  }

  // Get user ID from backend using wallet address
  const getUserId = async (walletAddress: string): Promise<number | null> => {
    try {
      const response = await fetch(`http://localhost:3001/users/wallet/${walletAddress}`)
      if (response.ok) {
        const result = await response.json()
        return result.data.id
      }
      return null
    } catch (error) {
      console.error('Error fetching user ID:', error)
      return null
    }
  }

  // Create order in backend database
  const createOrderInBackend = async () => {
    if (!wallet.address) {
      throw new Error('Wallet not connected')
    }

    const userId = await getUserId(wallet.address)
    if (!userId) {
      throw new Error('User not found in database')
    }

    const orderData = {
      user_id: userId,
      side: side.toUpperCase(), // Convert to BUY/SELL
      price: orderType === 'market' ? actualCurrentPrice : parseFloat(price),
      // price: null,
      quantity: parseFloat(size),
      leverage: leverage[0],
      margin: calculateMargin(),
      max_slippage_bps: 5, // Default 5 basis points
      status: "OPEN"
    }

    const response = await fetch('http://localhost:3001/orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create order')
    }

    return await response.json()
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

    if (!wallet.isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place orders",
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

    setIsSubmitting(true)
  
    try {
      // First, create order in backend database
      toast({
        title: "Creating order",
        description: "Saving order to database...",
      })

      const orderResult = await createOrderInBackend()
      console.log('Order created in backend:', orderResult.data)

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
      
      if (error instanceof Error) {
        if (error.message.includes('User not found')) {
          errorMessage = "User not found in database. Please reconnect your wallet."
        } else if (error.message.includes('Failed to create order')) {
          errorMessage = "Failed to create order in database"
        } else if (error.message.includes('Wallet not connected')) {
          errorMessage = "Please connect your wallet first"
        }
      }
      
      if ((error as any)?.code === 4001) {
        errorMessage = "Transaction rejected by user"
      } else if ((error as any)?.code === -32603) {
        errorMessage = "Transaction failed - please check your balance and try again"
      } else if ((error as any)?.message?.includes("ZeroAmount")) {
        errorMessage = "Invalid amount - size must be greater than 0"
      } else if ((error as any)?.message?.includes("InsufficientMargin")) {
        errorMessage = "Insufficient margin for this trade"
      } else if ((error as any)?.message?.includes("InvalidLeverage")) {
        errorMessage = "Leverage exceeds maximum allowed"
      } else if ((error as any)?.message?.includes("InvalidPrice")) {
        errorMessage = "Invalid price - please try again"
      }
  
      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade BTC-USD</span>
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
            variant={side === "buy" ? "default" : "outline"}
            onClick={() => setSide("buy")}
            className={side === "buy" ? "bg-long hover:bg-long/90 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Long
          </Button>
          <Button
            variant={side === "sell" ? "default" : "outline"}
            onClick={() => setSide("sell")}
            className={side === "sell" ? "bg-short hover:bg-short/90 text-white" : ""}
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

        {/* Wallet Connection Status */}
        {!wallet.isConnected && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Please connect your wallet to place orders
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmitOrder}
          className={`w-full ${
            side === "buy" ? "bg-long hover:bg-long/90 text-white" : "bg-short hover:bg-short/90 text-white"
          }`}
          disabled={!size || !wallet.isConnected || isSubmitting}
        >
          {isSubmitting 
            ? "Processing..." 
            : side === "buy" 
              ? "Open Buy Position" 
              : "Open Sell Position"
          }
        </Button>

        {/* Balance Info */}
        <div className="text-xs text-muted-foreground text-center">
          Available Balance: {userBalance.toFixed(4)} rBTC
          {wallet.isConnected && (
            <div className="mt-1">
              Connected: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
