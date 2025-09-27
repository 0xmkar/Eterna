import { useState, useEffect, useCallback } from 'react'
import { redstoneService, type PriceData } from '../services/redstoneService'

interface UseBTCPriceOptions {
  refreshInterval?: number // in milliseconds
  enableAutoRefresh?: boolean
}

interface UseBTCPriceReturn {
  price: number
  priceData: PriceData | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
  refreshPrice: () => Promise<void>
}

export function useBTCPrice(options: UseBTCPriceOptions = {}): UseBTCPriceReturn {
  const { 
    refreshInterval = 30000, // 30 seconds default
    enableAutoRefresh = true 
  } = options

  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      setError(null)
      const data = await redstoneService.getBTCPrice()
      setPriceData(data)
      setLastUpdated(Date.now())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch BTC price'
      setError(errorMessage)
      console.error('Error fetching BTC price:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPrice = useCallback(async () => {
    setLoading(true)
    await fetchPrice()
  }, [fetchPrice])

  // Initial fetch
  useEffect(() => {
    fetchPrice()
  }, [fetchPrice])

  // Auto-refresh setup
  useEffect(() => {
    if (!enableAutoRefresh) return

    const interval = setInterval(() => {
      fetchPrice()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchPrice, refreshInterval, enableAutoRefresh])

  return {
    price: priceData?.price || 0,
    priceData,
    loading,
    error,
    lastUpdated,
    refreshPrice
  }
}

// Hook for getting historical price changes (simulated for now)
export function useBTCPriceWithHistory() {
  const { price, priceData, loading, error, refreshPrice } = useBTCPrice()
  
  // For now, we'll simulate 24h changes
  // In a real implementation, you'd fetch historical data
  const [priceHistory, setPriceHistory] = useState({
    change24h: 0,
    changePercent24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0
  })

  useEffect(() => {
    if (price > 0) {
      // Simulate realistic price changes
      const change24h = (Math.random() - 0.5) * price * 0.05 // +/- 2.5%
      const changePercent24h = (change24h / price) * 100
      const high24h = price + Math.abs(change24h) * 0.3
      const low24h = price - Math.abs(change24h) * 0.3
      const volume24h = Math.random() * 1000 + 500 // Random volume

      setPriceHistory({
        change24h,
        changePercent24h,
        high24h,
        low24h,
        volume24h
      })
    }
  }, [price])

  return {
    price,
    priceData,
    loading,
    error,
    refreshPrice,
    ...priceHistory
  }
} 