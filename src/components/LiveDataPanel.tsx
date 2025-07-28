'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLiveData } from '@/hooks/useLiveData'
import { DEFAULT_SYMBOL } from '@/utils/constants'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { OrderBook } from './OrderBook'

interface LiveDataPanelProps {
  symbol?: string
  className?: string
}

export function LiveDataPanel({
  symbol = DEFAULT_SYMBOL,
  className = ''
}: LiveDataPanelProps) {
  const [lastPriceDirection, setLastPriceDirection] = useState<
    'up' | 'down' | null
  >(null)

  const {
    orderBook,
    ticker,
    loading: liveDataLoading,
    error: liveDataError,
    realTimePrice,
    previousPrice,
    connectionStatus: liveDataConnectionStatus,
    refreshLiveData
  } = useLiveData({ symbol, enableWebSocket: true })

  // Track price direction changes
  useEffect(() => {
    if (realTimePrice && previousPrice) {
      if (realTimePrice > previousPrice) {
        setLastPriceDirection('up')
      } else if (realTimePrice < previousPrice) {
        setLastPriceDirection('down')
      }
    }
  }, [realTimePrice, previousPrice])

  // Show toast notifications for errors and connection status
  useEffect(() => {
    if (liveDataError && orderBook === null && ticker === null) {
      toast.error('Failed to load live data', {
        description: liveDataError,
        action: {
          label: 'Retry',
          onClick: refreshLiveData
        },
        duration: 10000
      })
    }
  }, [liveDataError, orderBook, ticker, refreshLiveData])

  useEffect(() => {
    if (liveDataConnectionStatus === 'disconnected') {
      toast.warning('Connection Lost', {
        description:
          'Real-time data connection has been lost. Attempting to reconnect...',
        duration: 5000
      })
    }
  }, [liveDataConnectionStatus])

  useEffect(() => {
    if (liveDataConnectionStatus === 'connecting') {
      // Don't show a toast for connecting status as it might be just a symbol change
      // The loading state in the UI will indicate the change
    }
  }, [liveDataConnectionStatus])

  useEffect(() => {
    if (liveDataConnectionStatus === 'error') {
      toast.error('Connection Error', {
        description: 'Unable to establish real-time data connection.',
        duration: 8000
      })
    }
  }, [liveDataConnectionStatus])

  return (
    <div className={`flex-1 lg:max-w-[20rem] flex flex-col gap-2 ${className}`}>
      <div className="flex gap-2">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Live Price
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`text-xl font-bold ${lastPriceDirection === 'up' ? 'text-green-400' : lastPriceDirection === 'down' ? 'text-red-400' : 'text-green-400'}`}>
              {realTimePrice && !isNaN(realTimePrice) && !liveDataLoading
                ? `$${realTimePrice.toLocaleString()}`
                : liveDataLoading
                  ? 'Loading...'
                  : 'No data'}
            </div>
            <div
              className={`text-sm md:text-base font-medium mt-1 capitalize ${!liveDataLoading && (ticker?.priceChangePercent || ticker?.P) ? (parseFloat(ticker.priceChangePercent || ticker.P || '0') > 0 ? 'text-green-400' : parseFloat(ticker.priceChangePercent || ticker.P || '0') < 0 ? 'text-red-400' : 'text-muted-foreground') : 'text-muted-foreground'}`}>
              {!liveDataLoading && (ticker?.priceChangePercent || ticker?.P)
                ? `${parseFloat(ticker.priceChangePercent || ticker.P || '0').toFixed(2)}%`
                : liveDataLoading
                  ? 'Loading...'
                  : '0.00%'}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              {!liveDataLoading && (ticker?.volume || ticker?.quoteVolume)
                ? parseFloat(
                    ticker.volume || ticker.quoteVolume || '0'
                  ).toLocaleString()
                : liveDataLoading
                  ? 'Loading...'
                  : 'No data'}
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderBook
        orderBook={orderBook}
        loading={liveDataLoading}
        symbol={symbol}
      />
    </div>
  )
}
