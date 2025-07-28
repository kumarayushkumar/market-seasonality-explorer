import { API_CONFIG, DEFAULT_SYMBOL } from '@/utils/constants'
import { getWeekNumber } from '@/utils/helper'

export interface OrderBookData {
  symbol: string
  bids: [string, string][]
  asks: [string, string][]
  lastUpdateId: number
}

export interface KlineData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
}

export interface TickerData {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
  // WebSocket specific fields
  c?: string // Current price (WebSocket format)
  P?: string // Price change percent (WebSocket format)
  v?: string // Volume (WebSocket format)
  Q?: string // Quote volume (WebSocket format)
}

export interface FinancialMetrics {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  volatility: number
  liquidity: number
  performance: number
  // Additional metrics for weekly/monthly views
  avgDailyVolume?: number
  avgDailyLiquidity?: number
  volatilityRange?: number
  daysCount?: number
}

// WebSocket extension types
interface ExtendedWebSocket extends WebSocket {
  changeSymbol?: (symbol: string) => void
  closeIntentionally?: () => void
  getCurrentSymbol?: () => string
}

// WebSocket message types
export interface WebSocketKlineUpdate {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  k: {
    t: number // Kline start time
    T: number // Kline close time
    s: string // Symbol
    i: string // Interval
    f: number // First trade ID
    L: number // Last trade ID
    o: string // Open price
    c: string // Close price
    h: string // High price
    l: string // Low price
    v: string // Base asset volume
    n: number // Number of trades
    x: boolean // Is this kline closed?
    q: string // Quote asset volume
    V: string // Taker buy base asset volume
    Q: string // Taker buy quote asset volume
  }
}

export interface WebSocketDepthUpdate {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  U: number // First update ID in event
  u: number // Final update ID in event
  b: [string, string][] // Bids to be updated
  a: [string, string][] // Asks to be updated
}

export interface WebSocketTickerUpdate {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  p: string // Price change
  P: string // Price change percent
  w: string // Weighted average price
  x: string // Previous close price
  c: string // Current close price
  Q: string // Close quantity
  b: string // Best bid price
  B: string // Best bid quantity
  a: string // Best ask price
  A: string // Best ask quantity
  o: string // Open price
  h: string // High price
  l: string // Low price
  v: string // Total traded base asset volume
  q: string // Total traded quote asset volume
  O: number // Statistics open time
  C: number // Statistics close time
  F: number // First trade ID
  L: number // Last trade ID
  n: number // Total number of trades
}

// Raw kline data from API
export interface RawKlineData extends Array<string | number> {
  0: number // Open time
  1: string // Open price
  2: string // High price
  3: string // Low price
  4: string // Close price
  5: string // Volume
  6: number // Close time
  7: string // Quote asset volume
  8: number // Number of trades
  9: string // Taker buy base asset volume
  10: string // Taker buy quote asset volume
  11: string // Ignore
}

class BinanceApiService {
  private baseUrl = API_CONFIG.BASE_URL
  private wsUrl = API_CONFIG.WS_URL

  // Fetch orderbook data
  async getOrderBook(
    symbol: string = DEFAULT_SYMBOL,
    limit: number = API_CONFIG.DEFAULT_LIMIT
  ): Promise<OrderBookData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/depth?symbol=${symbol}&limit=${limit}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  // Fetch ticker data
  async getTicker(symbol: string = DEFAULT_SYMBOL): Promise<TickerData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ticker/24hr?symbol=${symbol}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  // Fetch kline data
  async getKlineData(
    symbol: string = DEFAULT_SYMBOL,
    interval: string = '1d',
    limit: number = 365
  ): Promise<KlineData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: RawKlineData[] = await response.json()
      return data.map((kline: RawKlineData) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteAssetVolume: kline[7],
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: kline[9],
        takerBuyQuoteAssetVolume: kline[10]
      }))
    } catch (error) {
      throw error
    }
  }

  // Fetch comprehensive kline data with pagination
  async getComprehensiveKlineData(
    symbol: string = DEFAULT_SYMBOL,
    interval: string = '1d',
    targetLimit: number = 4000
  ): Promise<KlineData[]> {
    try {
      const allKlines: KlineData[] = []
      let currentLimit = Math.min(targetLimit, 1000) // Binance max per request
      let endTime: number | undefined

      while (allKlines.length < targetLimit) {
        const url = new URL(`${this.baseUrl}/klines`)
        url.searchParams.set('symbol', symbol)
        url.searchParams.set('interval', interval)
        url.searchParams.set('limit', currentLimit.toString())
        if (endTime) {
          url.searchParams.set('endTime', endTime.toString())
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: RawKlineData[] = await response.json()
        const klineData = data.map((kline: RawKlineData) => ({
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[5],
          closeTime: kline[6],
          quoteAssetVolume: kline[7],
          numberOfTrades: kline[8],
          takerBuyBaseAssetVolume: kline[9],
          takerBuyQuoteAssetVolume: kline[10]
        }))

        if (klineData.length === 0) break

        allKlines.unshift(...klineData)
        endTime = klineData[0].openTime - 1

        // If we got less than requested, we've reached the end
        if (klineData.length < currentLimit) break

        // Reduce limit for next request to avoid duplicates
        currentLimit = Math.min(currentLimit, targetLimit - allKlines.length)
      }

      return allKlines.slice(0, targetLimit)
    } catch (error) {
      throw error
    }
  }

  // Transform kline data to financial metrics
  transformToFinancialMetrics(
    klineData: KlineData[],
    interval: string = '1d'
  ): FinancialMetrics[] {
    return klineData.map(kline => {
      const open = parseFloat(kline.open)
      const high = parseFloat(kline.high)
      const low = parseFloat(kline.low)
      const close = parseFloat(kline.close)
      const volume = parseFloat(kline.volume)

      // Calculate performance (percentage change)
      const performance = ((close - open) / open) * 100

      // Calculate volatility (high-low range as percentage of open)
      const volatility = ((high - low) / open) * 100

      // Calculate liquidity (use volume and price stability as proxy)
      // Higher liquidity = higher volume + lower price volatility
      const volumeWeight = 0.7
      const stabilityWeight = 0.3
      const priceStability = 1 - volatility / 100 // Lower volatility = higher stability
      const liquidity =
        volume * volumeWeight + volume * priceStability * stabilityWeight

      // Format date based on interval
      let date: string
      const openTimeDate = new Date(kline.openTime)

      if (interval === '1w') {
        // For weekly data, use YYYY-WXX format with new week numbering
        // Week 1 starts from January 1st, not ISO week numbering
        const week = getWeekNumber(openTimeDate)
        const year = openTimeDate.getFullYear()

        date = `${year}-W${String(week).padStart(2, '0')}`
      } else if (interval === '1M') {
        // For monthly data, use YYYY-MM format
        const year = openTimeDate.getFullYear()
        const month = openTimeDate.getMonth() + 1
        date = `${year}-${String(month).padStart(2, '0')}`
      } else {
        date = openTimeDate.toISOString().split('T')[0]
      }

      return {
        date,
        open,
        high,
        low,
        close,
        volume,
        volatility,
        liquidity,
        performance
      }
    })
  }

  // Create real-time WebSocket connection
  createRealTimeWebSocket(
    symbol: string,
    callbacks: {
      onOrderBookUpdate?: (data: OrderBookData) => void
      onTickerUpdate?: (data: TickerData) => void
      onKlineUpdate?: (data: WebSocketKlineUpdate) => void
    }
  ): ExtendedWebSocket {
    // Use combined stream endpoint for dynamic subscriptions
    const ws = new WebSocket(`${this.wsUrl}/ws/stream`) as ExtendedWebSocket

    let currentSymbol = symbol.toLowerCase()
    let intentionallyClosed = false
    let reconnectTimeout: NodeJS.Timeout | null = null

    // Add method to change symbol dynamically WITHOUT reconnecting
    ;(ws as ExtendedWebSocket).changeSymbol = (newSymbol: string) => {
      const newSymbolLower = newSymbol.toLowerCase()
      if (newSymbolLower === currentSymbol) return // No change needed

      // Unsubscribe from current symbol streams
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            method: 'UNSUBSCRIBE',
            params: [`${currentSymbol}@depth@100ms`, `${currentSymbol}@ticker`],
            id: Date.now()
          })
        )

        // Small delay to ensure unsubscription is processed
        setTimeout(() => {
          // Subscribe to new symbol streams
          ws.send(
            JSON.stringify({
              method: 'SUBSCRIBE',
              params: [
                `${newSymbolLower}@depth@100ms`,
                `${newSymbolLower}@ticker`
              ],
              id: Date.now() + 1
            })
          )
          currentSymbol = newSymbolLower
        }, 100)
      }
    }

    // Add method to close connection intentionally
    ;(ws as ExtendedWebSocket).closeIntentionally = () => {
      intentionallyClosed = true
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      ws.close()
    }

    // Add method to get current symbol
    ;(ws as ExtendedWebSocket).getCurrentSymbol = () => currentSymbol

    ws.onopen = () => {
      // Subscribe to initial symbol streams
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [`${currentSymbol}@depth@100ms`, `${currentSymbol}@ticker`],
          id: Date.now()
        })
      )
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        // Handle subscription responses
        if (data.result === null && data.id) {
          // Subscription/unsubscription successful
          return
        }

        // Handle stream data (Combined stream format)
        if (data.stream && data.data) {
          const streamData = data.data

          if (streamData.e === 'depthUpdate') {
            // Orderbook update - happens every 100ms
            if (callbacks.onOrderBookUpdate) {
              callbacks.onOrderBookUpdate(streamData)
            }
          } else if (streamData.e === '24hrTicker') {
            // Ticker update - happens every 1s
            if (callbacks.onTickerUpdate) {
              callbacks.onTickerUpdate(streamData)
            }
          } else if (streamData.e === 'kline') {
            // Kline update
            if (callbacks.onKlineUpdate) {
              callbacks.onKlineUpdate(streamData)
            }
          }
        }
      } catch {
        // Handle parsing error silently
      }
    }

    ws.onerror = () => {
      // Handle WebSocket error silently
    }

    ws.onclose = () => {
      // Only attempt to reconnect if not intentionally closed
      if (!intentionallyClosed) {
        reconnectTimeout = setTimeout(() => {
          const newWs = this.createRealTimeWebSocket(currentSymbol, callbacks)
          ws.changeSymbol = newWs.changeSymbol
          ws.closeIntentionally = newWs.closeIntentionally
          ws.getCurrentSymbol = newWs.getCurrentSymbol
        }, 5000)
      }
    }

    return ws
  }

  // Create WebSocket connection for live data with dynamic symbol switching
  createLiveDataWebSocket(
    symbol: string,
    callbacks: {
      onOrderBookUpdate?: (data: OrderBookData) => void
    }
  ): ExtendedWebSocket {
    const ws = new WebSocket(
      `${this.wsUrl}/ws/${symbol.toLowerCase()}@depth@100ms`
    ) as ExtendedWebSocket

    let currentSymbol = symbol.toLowerCase()
    let intentionallyClosed = false
    let reconnectTimeout: NodeJS.Timeout | null = null

    ;(ws as ExtendedWebSocket).changeSymbol = (newSymbol: string) => {
      const newSymbolLower = newSymbol.toLowerCase()
      if (newSymbolLower === currentSymbol) return

      intentionallyClosed = true
      ws.close()

      setTimeout(() => {
        const newWs = this.createLiveDataWebSocket(newSymbol, callbacks)
        ws.changeSymbol = newWs.changeSymbol
        ws.closeIntentionally = newWs.closeIntentionally
        ws.getCurrentSymbol = newWs.getCurrentSymbol
        currentSymbol = newSymbolLower
        intentionallyClosed = false
      }, 100)
    }
    ;(ws as ExtendedWebSocket).closeIntentionally = () => {
      intentionallyClosed = true
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      ws.close()
    }
    ;(ws as ExtendedWebSocket).getCurrentSymbol = () => currentSymbol

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        if (data.e === 'depthUpdate') {
          if (callbacks.onOrderBookUpdate) {
            callbacks.onOrderBookUpdate(data)
          }
        }
      } catch {}
    }

    ws.onopen = () => {}

    ws.onerror = () => {}

    ws.onclose = () => {
      if (!intentionallyClosed) {
        reconnectTimeout = setTimeout(() => {
          const newWs = this.createLiveDataWebSocket(currentSymbol, callbacks)
          ws.changeSymbol = newWs.changeSymbol
          ws.closeIntentionally = newWs.closeIntentionally
          ws.getCurrentSymbol = newWs.getCurrentSymbol
        }, 5000)
      }
    }

    return ws
  }

  // Create WebSocket for calendar data updates
  createCalendarDataWebSocket(
    symbol: string,
    callbacks: {
      onKlineUpdate?: (data: WebSocketKlineUpdate) => void
    }
  ): ExtendedWebSocket {
    const ws = new WebSocket(`${this.wsUrl}/ws/stream`) as ExtendedWebSocket

    let currentSymbol = symbol.toLowerCase()
    let intentionallyClosed = false
    let reconnectTimeout: NodeJS.Timeout | null = null

    // Add method to change symbol dynamically WITHOUT reconnecting
    ;(ws as ExtendedWebSocket).changeSymbol = (newSymbol: string) => {
      const newSymbolLower = newSymbol.toLowerCase()
      if (newSymbolLower === currentSymbol) return // No change needed

      // Unsubscribe from current symbol stream
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            method: 'UNSUBSCRIBE',
            params: [`${currentSymbol}@kline_1d`],
            id: Date.now()
          })
        )

        // Subscribe to new symbol stream
        ws.send(
          JSON.stringify({
            method: 'SUBSCRIBE',
            params: [`${newSymbolLower}@kline_1d`],
            id: Date.now() + 1
          })
        )

        currentSymbol = newSymbolLower
      }
    }

    // Add method to close connection intentionally
    ;(ws as ExtendedWebSocket).closeIntentionally = () => {
      intentionallyClosed = true
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      ws.close()
    }

    // Add method to get current symbol
    ;(ws as ExtendedWebSocket).getCurrentSymbol = () => currentSymbol

    ws.onopen = () => {
      // Subscribe to initial symbol stream
      ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [`${currentSymbol}@kline_1d`],
          id: Date.now()
        })
      )
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        // Handle subscription responses
        if (data.result === null && data.id) {
          // Subscription/unsubscription successful
          return
        }

        // Handle stream data (Combined stream format)
        if (data.stream && data.data) {
          const streamData = data.data

          if (streamData.e === 'kline') {
            if (callbacks.onKlineUpdate) {
              callbacks.onKlineUpdate(streamData)
            }
          }
        }
      } catch {
        // Handle parsing error silently
      }
    }

    ws.onerror = () => {
      // Handle WebSocket error silently
    }

    ws.onclose = () => {
      // Only attempt to reconnect if not intentionally closed
      if (!intentionallyClosed) {
        reconnectTimeout = setTimeout(() => {
          // Recreate connection with current symbol
          const newWs = this.createCalendarDataWebSocket(
            currentSymbol,
            callbacks
          )
          // Copy over the methods to maintain reference
          ws.changeSymbol = newWs.changeSymbol
          ws.closeIntentionally = newWs.closeIntentionally
          ws.getCurrentSymbol = newWs.getCurrentSymbol
        }, 5000)
      }
    }

    return ws
  }
}

export const binanceApi = new BinanceApiService()
