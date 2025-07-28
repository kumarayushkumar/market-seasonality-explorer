import {
  binanceApi,
  FinancialMetrics,
  WebSocketKlineUpdate
} from '@/services/api'
import { DEFAULT_SYMBOL } from '@/utils/constants'
import { getLastCompletedWeek, getWeekNumber } from '@/utils/helper'
import { useCallback, useEffect, useRef, useState } from 'react'

// WebSocket extension type
interface ExtendedWebSocket extends WebSocket {
  changeSymbol?: (symbol: string) => void
  closeIntentionally?: () => void
  getCurrentSymbol?: () => string
}

export interface UseCalendarDataOptions {
  symbol?: string
  interval?: string
  limit?: number
  enableWebSocket?: boolean
}

export interface CalendarDataState {
  data: FinancialMetrics[]
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export function useCalendarData(options: UseCalendarDataOptions = {}) {
  const {
    symbol = DEFAULT_SYMBOL,
    interval = '1d',
    limit = 365,
    enableWebSocket = true
  } = options

  const [state, setState] = useState<CalendarDataState>({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null,
    connectionStatus: 'disconnected'
  })

  const wsRef = useRef<ExtendedWebSocket | null>(null)
  const currentSymbolRef = useRef<string>(symbol)

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const klineData = await binanceApi.getComprehensiveKlineData(
        symbol,
        interval,
        limit
      )

      const financialMetrics = binanceApi.transformToFinancialMetrics(
        klineData,
        interval
      )

      setState(prev => ({
        ...prev,
        data: financialMetrics,
        loading: false,
        lastUpdate: new Date(),
        connectionStatus: 'connected'
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch calendar data',
        connectionStatus: 'error'
      }))
    }
  }, [symbol, interval, limit])

  // Setup WebSocket connection for calendar data
  const setupWebSocket = useCallback(() => {
    if (!enableWebSocket) return

    // Check if we already have a WebSocket for this symbol
    if (wsRef.current && currentSymbolRef.current === symbol) {
      return // Already connected to the same symbol
    }

    // If we have an existing connection, try to change symbol dynamically
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (wsRef.current.changeSymbol) {
        // Update connection status to show symbol change (but don't show as disconnected)
        setState(prev => ({
          ...prev,
          connectionStatus: 'connecting'
          // Don't set loading to true to avoid showing loading state during symbol change
        }))

        // Change symbol dynamically
        wsRef.current.changeSymbol(symbol)
        currentSymbolRef.current = symbol

        // Fetch new data for the new symbol
        fetchCalendarData()
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
      }

      setState(prev => ({ ...prev, connectionStatus: 'connecting' }))

      // Create new WebSocket connection for calendar data only
      wsRef.current = binanceApi.createCalendarDataWebSocket(symbol, {
        onKlineUpdate: (klineData: WebSocketKlineUpdate) => {
          // Update the latest kline data in our dataset
          setState(prev => {
            const newData = [...prev.data]
            const dateString = new Date(klineData.k.t)
              .toISOString()
              .split('T')[0]
            const existingIndex = newData.findIndex(
              item => item.date === dateString
            )

            if (existingIndex >= 0) {
              const k = klineData.k
              newData[existingIndex] = {
                date: dateString,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
                volatility:
                  ((parseFloat(k.h) - parseFloat(k.l)) / parseFloat(k.o)) * 100,
                liquidity: parseFloat(k.v), // Use volume as proxy
                performance:
                  ((parseFloat(k.c) - parseFloat(k.o)) / parseFloat(k.o)) * 100
              }
            }

            return {
              ...prev,
              data: newData,
              lastUpdate: new Date(),
              connectionStatus: 'connected'
            }
          })
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
  }, [symbol, enableWebSocket, fetchCalendarData])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  // Fetch new data when symbol changes (but don't reset WebSocket)
  useEffect(() => {
    fetchCalendarData()
  }, [symbol, fetchCalendarData])

  // Setup WebSocket when symbol changes or enableWebSocket changes
  useEffect(() => {
    if (enableWebSocket) {
      if (currentSymbolRef.current !== symbol) {
        currentSymbolRef.current = symbol
        setupWebSocket()
      }
    }
  }, [symbol, enableWebSocket, setupWebSocket])

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
      }, 15000) // 15 second timeout

      return () => clearTimeout(timeout)
    }
  }, [state.loading, state.error])

  // Refresh data function
  const refreshCalendarData = useCallback(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  // Get aggregated data for different timeframes
  const getAggregatedData = useCallback(
    (timeframe: 'daily' | 'weekly' | 'monthly') => {
      if (timeframe === 'daily') {
        return state.data
      }

      // Filter out incomplete weeks
      const lastCompleted = getLastCompletedWeek()
      const filteredData = state.data.filter(item => {
        if (timeframe === 'weekly' && item.date.includes('-W')) {
          // For weekly data, check if it's beyond the last completed week
          const [year, week] = item.date.split('-W')
          const itemYear = parseInt(year)
          const itemWeek = parseInt(week)

          if (itemYear > lastCompleted.year) {
            return false // Future year
          }
          if (
            itemYear === lastCompleted.year &&
            itemWeek > lastCompleted.week
          ) {
            return false // Current year but beyond last completed week
          }
        }
        return true
      })

      const groupedData = new Map<string, FinancialMetrics[]>()

      filteredData.forEach(item => {
        let key: string
        const date = new Date(item.date)

        switch (timeframe) {
          case 'weekly':
            // Use week number as key to match calendar lookup
            const weekNum = getWeekNumber(date)
            const year = date.getFullYear()
            key = `${year}-W${String(weekNum).padStart(2, '0')}`
            break
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            break
          default:
            key = item.date
        }

        if (!groupedData.has(key)) {
          groupedData.set(key, [])
        }
        groupedData.get(key)!.push(item)
      })

      return Array.from(groupedData.entries())
        .map(([key, items]) => {
          // Sort items by date to ensure proper OHLC calculation
          items.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )

          // Calculate proper OHLC (Open-High-Low-Close)
          const open = items[0].open // First day's open
          const close = items[items.length - 1].close // Last day's close
          const high = Math.max(...items.map(item => item.high))
          const low = Math.min(...items.map(item => item.low))

          // Calculate total volume and liquidity
          const totalVolume = items.reduce((sum, item) => sum + item.volume, 0)
          const totalLiquidity = items.reduce(
            (sum, item) => sum + item.liquidity,
            0
          )

          // Calculate average volatility (weighted by volume)
          const totalVolumeForVolatility = items.reduce(
            (sum, item) => sum + item.volume,
            0
          )
          const weightedVolatility =
            items.reduce(
              (sum, item) => sum + item.volatility * item.volume,
              0
            ) / totalVolumeForVolatility

          // Calculate performance based on open and close
          const performance = ((close - open) / open) * 100

          // Calculate additional metrics for weekly/monthly views
          const avgDailyVolume = totalVolume / items.length
          const avgDailyLiquidity = totalLiquidity / items.length
          const volatilityRange =
            Math.max(...items.map(item => item.volatility)) -
            Math.min(...items.map(item => item.volatility))

          return {
            date: key,
            open,
            high,
            low,
            close,
            volume: totalVolume,
            volatility: weightedVolatility,
            liquidity: totalLiquidity,
            performance,
            // Additional metrics for enhanced analysis
            avgDailyVolume,
            avgDailyLiquidity,
            volatilityRange,
            daysCount: items.length
          }
        })
        .sort((a, b) => {
          // Handle sorting for different date formats
          if (a.date.includes('-W') && b.date.includes('-W')) {
            // Weekly format: "2024-W01" -> sort by year and week
            const [yearA, weekA] = a.date.split('-W')
            const [yearB, weekB] = b.date.split('-W')
            if (yearA !== yearB) {
              return parseInt(yearA) - parseInt(yearB)
            }
            return parseInt(weekA) - parseInt(weekB)
          } else {
            // Date format: sort by actual date
            return new Date(a.date).getTime() - new Date(b.date).getTime()
          }
        })
    },
    [state.data]
  )

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    connectionStatus: state.connectionStatus,
    refreshCalendarData,
    getAggregatedData
  }
}
