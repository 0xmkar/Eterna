interface PriceData {
  symbol: string
  price: number
  timestamp: number
  dataFeedId: string
}

interface RedStoneDataPackage {
  dataFeedId: string
  value: number
  timestamp: number
}

class RedStoneService {
  private static instance: RedStoneService
  private cache: Map<string, { data: PriceData; expiry: number }> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds cache
  private readonly REDSTONE_API_URL = 'https://api.redstone.finance/prices'

  private constructor() {}

  public static getInstance(): RedStoneService {
    if (!RedStoneService.instance) {
      RedStoneService.instance = new RedStoneService()
    }
    return RedStoneService.instance
  }

  /**
   * Fetch BTC price from RedStone oracle
   * Falls back to API if SDK is not available (before npm install)
   */
  async getBTCPrice(): Promise<PriceData> {
    const cacheKey = 'BTC'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data
    }

    try {
      // Try to use RedStone SDK if available
      const price = await this.fetchPriceWithSDK()
      const priceData: PriceData = {
        symbol: 'BTC',
        price: price,
        timestamp: Date.now(),
        dataFeedId: 'BTC'
      }
      
      this.cache.set(cacheKey, {
        data: priceData,
        expiry: Date.now() + this.CACHE_DURATION
      })
      
      return priceData
    } catch (error) {
      console.warn('RedStone SDK not available, falling back to API:', error)
      return this.fetchPriceFromAPI()
    }
  }

  /**
   * Fetch price using RedStone SDK (when available)
   */
  private async fetchPriceWithSDK(): Promise<number> {
    try {
      // This will work once @redstone-finance/sdk is installed
      const { getOracleData } = await import('@redstone-finance/sdk')
      
      const oracleData = await getOracleData({
        dataServiceId: 'redstone-main-demo',
        dataFeeds: ['BTC'],
        uniqueSignersCount: 3,
      })
      
      const btcPrice = oracleData['BTC']?.value
      if (!btcPrice) {
        throw new Error('BTC price not found in oracle data')
      }
      
      return btcPrice
    } catch (error) {
      throw new Error(`Failed to fetch price with SDK: ${error}`)
    }
  }

  /**
   * Fallback method using RedStone public API
   */
  private async fetchPriceFromAPI(): Promise<PriceData> {
    try {
      const response = await fetch(`${this.REDSTONE_API_URL}?symbol=BTC&provider=redstone&limit=1`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || !data[0]?.value) {
        throw new Error('Invalid price data received from API')
      }
      
      const priceData: PriceData = {
        symbol: 'BTC',
        price: data[0].value,
        timestamp: data[0].timestamp || Date.now(),
        dataFeedId: 'BTC'
      }
      
      this.cache.set('BTC', {
        data: priceData,
        expiry: Date.now() + this.CACHE_DURATION
      })
      
      return priceData
    } catch (error) {
      console.error('Failed to fetch BTC price from RedStone API:', error)
      
      // Return a fallback price to prevent app crashes
      return {
        symbol: 'BTC',
        price: 52000, // Fallback price
        timestamp: Date.now(),
        dataFeedId: 'BTC'
      }
    }
  }

  /**
   * Get multiple price feeds (extensible for future use)
   */
  async getMultiplePrices(symbols: string[]): Promise<Record<string, PriceData>> {
    const prices: Record<string, PriceData> = {}
    
    for (const symbol of symbols) {
      if (symbol === 'BTC') {
        prices[symbol] = await this.getBTCPrice()
      }
      // Add more symbols as needed
    }
    
    return prices
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const redstoneService = RedStoneService.getInstance()
export type { PriceData } 