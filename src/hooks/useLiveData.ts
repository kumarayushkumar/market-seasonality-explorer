import {
  binanceApi,
  OrderBookData,
  TickerData,
  WebSocketDepthUpdate
} from '@/services/api'
import { DEFAULT_SYMBOL } from '@/utils/constants'
import { useCallback, useEffect, useRef, useState } from 'react'

// WebSocket extension type
interface ExtendedWebSocket extends WebSocket {
  changeSymbol?: (symbol: string) => void
  closeIntentionally?: () => void
  getCurrentSymbol?: () => string
}

export interface UseLiveDataOptions {
  symbol?: string
  enableWebSocket?: boolean
}

export interface LiveDataState {
  orderBook: OrderBookData | null
  ticker: TickerData | null
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  realTimePrice: number | null
  previousPrice: number | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export function useLiveData(options: UseLiveDataOptions = {}) {
  const { symbol = DEFAULT_SYMBOL, enableWebSocket = true } = options

  const [state, setState] = useState<LiveDataState>({
    orderBook: null,
    ticker: null,
    loading: true,
    error: null,
    lastUpdate: null,
    realTimePrice: null,
    previousPrice: null,
    connectionStatus: 'disconnected'
  })

  const wsRef = useRef<ExtendedWebSocket | null>(null)
  const orderBookSnapshotRef = useRef<OrderBookData | null>(null)
  const currentSymbolRef = useRef<string>(symbol)

  // Fetch initial live data
  const fetchLiveData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Fetch orderbook and ticker data
      const [orderBook, ticker] = await Promise.all([
        binanceApi.getOrderBook(symbol),
        binanceApi.getTicker(symbol)
      ])

      // Store snapshot for real-time updates
      orderBookSnapshotRef.current = orderBook

      setState(prev => ({
        ...prev,
        orderBook,
        ticker,
        realTimePrice: parseFloat(ticker.lastPrice),
        previousPrice: null, // No previous price on initial load
        loading: false,
        lastUpdate: new Date(),
        connectionStatus: 'connected'
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch live data',
        connectionStatus: 'error'
      }))
    }
  }, [symbol])

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!enableWebSocket) return

    // Check if we already have a WebSocket for this symbol
    if (wsRef.current && currentSymbolRef.current === symbol) {
      return // Already connected to the same symbol
    }

    // If we have an existing connection, try to change symbol dynamically
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (wsRef.current.changeSymbol) {
        // Clear the order book snapshot when changing symbols
        orderBookSnapshotRef.current = null
        currentSymbolRef.current = symbol

        // Update connection status to show symbol change (but don't show loading)
        setState(prev => ({
          ...prev,
          connectionStatus: 'connecting'
          // Don't set loading to true to avoid showing loading state during symbol change
        }))

        // Change symbol dynamically
        wsRef.current.changeSymbol(symbol)

        // Fetch new initial data for the new symbol
        fetchLiveData()
        return
      }
    }

    // Only create a new connection if we don't have one or can't change symbol
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Cleanup existing connection only if we need to create a new one
      if (wsRef.current) {
        // Use closeIntentionally to prevent automatic reconnection
        if (wsRef.current.closeIntentionally) {
          wsRef.current.closeIntentionally()
        } else {
          wsRef.current.close()
        }
        wsRef.current = null
      }

      // Clear the order book snapshot when creating new connection
      orderBookSnapshotRef.current = null

      setState(prev => ({ ...prev, connectionStatus: 'connecting' }))

      // Helper to update order book snapshot with depthUpdate
      const applyDepthUpdate = (update: WebSocketDepthUpdate) => {
        if (!orderBookSnapshotRef.current) return
        // update.b (bids) and update.a (asks) are arrays of [price, qty]
        const { bids, asks } = orderBookSnapshotRef.current
        // Update bids
        update.b.forEach(([price, qty]: [string, string]) => {
          const idx = bids.findIndex(([p]) => p === price)
          if (parseFloat(qty) === 0) {
            if (idx !== -1) bids.splice(idx, 1)
          } else {
            if (idx !== -1) {
              bids[idx][1] = qty
            } else {
              bids.push([price, qty])
            }
          }
        })
        // Update asks
        update.a.forEach(([price, qty]: [string, string]) => {
          const idx = asks.findIndex(([p]) => p === price)
          if (parseFloat(qty) === 0) {
            if (idx !== -1) asks.splice(idx, 1)
          } else {
            if (idx !== -1) {
              asks[idx][1] = qty
            } else {
              asks.push([price, qty])
            }
          }
        })
        // Sort bids descending, asks ascending
        bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
        asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        // Limit to 100 levels
        orderBookSnapshotRef.current = {
          ...orderBookSnapshotRef.current,
          bids: bids.slice(0, 100),
          asks: asks.slice(0, 100)
        }
      }

      // Create new WebSocket connection for order book data only
      wsRef.current = binanceApi.createLiveDataWebSocket(symbol, {
        onOrderBookUpdate: orderBookData => {
          // If this is a depthUpdate, apply to snapshot
          if (
            orderBookData &&
            typeof orderBookData === 'object' &&
            'e' in orderBookData &&
            orderBookData.e === 'depthUpdate' &&
            'U' in orderBookData &&
            'u' in orderBookData &&
            'b' in orderBookData &&
            'a' in orderBookData
          ) {
            applyDepthUpdate(orderBookData as unknown as WebSocketDepthUpdate)
            setState(prev => ({
              ...prev,
              orderBook: orderBookSnapshotRef.current
                ? { ...orderBookSnapshotRef.current }
                : null,
              lastUpdate: new Date(),
              connectionStatus: 'connected'
            }))
          } else {
            // fallback for full snapshot (shouldn't happen in ws)
            setState(prev => ({
              ...prev,
              orderBook: orderBookData as OrderBookData,
              lastUpdate: new Date(),
              connectionStatus: 'connected'
            }))
          }
        }
      })

      wsRef.current.onopen = () => {
        currentSymbolRef.current = symbol
        setState(prev => ({ ...prev, connectionStatus: 'connected' }))
      }

      wsRef.current.onerror = () => {
        setState(prev => ({ ...prev, connectionStatus: 'error' }))
      }

      wsRef.current.onclose = () => {
        setState(prev => ({ ...prev, connectionStatus: 'disconnected' }))
      }
    }
  }, [symbol, enableWebSocket, fetchLiveData])

  // Initial data fetch and WebSocket setup
  useEffect(() => {
    fetchLiveData()

    if (enableWebSocket) {
      setupWebSocket()
    }
  }, [fetchLiveData, setupWebSocket, enableWebSocket])

  // Polling for ticker data updates
  useEffect(() => {
    if (!enableWebSocket) return

    const pollTicker = async () => {
      try {
        const ticker = await binanceApi.getTicker(symbol)
        const price = parseFloat(ticker.lastPrice)

        if (!isNaN(price)) {
          setState(prev => ({
            ...prev,
            ticker,
            previousPrice: prev.realTimePrice,
            realTimePrice: price,
            lastUpdate: new Date()
          }))
        }
      } catch {}
    }

    const interval = setInterval(pollTicker, 2000)

    return () => clearInterval(interval)
  }, [symbol, enableWebSocket])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        if (wsRef.current.closeIntentionally) {
          wsRef.current.closeIntentionally()
        } else {
          wsRef.current.close()
        }
      }
    }
  }, [])

  // Fallback: if loading takes too long, show error
  useEffect(() => {
    if (state.loading && !state.error) {
      const timeout = setTimeout(() => {
        setState(prev => ({
          ...prev,
          loading: false,
          error:
            'Request timeout. Please check your internet connection and try again.',
          connectionStatus: 'error'
        }))
      }, 15000)

      return () => clearTimeout(timeout)
    }
  }, [state.loading, state.error])

  // Refresh data function
  const refreshLiveData = useCallback(() => {
    fetchLiveData()
  }, [fetchLiveData])

  return {
    orderBook: state.orderBook,
    ticker: state.ticker,
    loading: state.loading,
    error: state.error,
    realTimePrice: state.realTimePrice,
    previousPrice: state.previousPrice,
    connectionStatus: state.connectionStatus,
    refreshLiveData
  }
}
