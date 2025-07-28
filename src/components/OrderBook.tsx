'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderBookData } from '@/services/api'
import { DEFAULT_SYMBOL } from '@/utils/constants'
import {
  calculateTotalQuantity,
  formatNumber,
  getDepthPercentage
} from '@/utils/helper'
import { TrendingUp } from 'lucide-react'
import React from 'react'

interface OrderBookProps {
  orderBook: OrderBookData | null
  loading?: boolean
  symbol?: string
}

export const OrderBook = React.memo(function OrderBook({
  orderBook,
  loading = false,
  symbol = DEFAULT_SYMBOL
}: OrderBookProps) {
  const totalBidQuantity = orderBook
    ? calculateTotalQuantity(orderBook.bids)
    : 0
  const totalAskQuantity = orderBook
    ? calculateTotalQuantity(orderBook.asks)
    : 0

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="lg:pb-2 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Order Book - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="lg:pt-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading order book...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!orderBook) {
    return (
      <Card className="w-full transition-all duration-200">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Order Book - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-muted-foreground text-4xl mb-3">📈</div>
              <p className="text-sm text-muted-foreground">
                No order book data available
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Unable to load data for {symbol}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full transition-all duration-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Order Book - {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Asks (Sell Orders) */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Asks (Sell)
            </div>
            <div className="space-y-1">
              {orderBook.asks.slice(0, 10).map((ask, index) => {
                const [price, quantity] = ask
                const depthPercentage = getDepthPercentage(
                  parseFloat(quantity),
                  totalAskQuantity
                )
                return (
                  <div
                    key={index}
                    className="relative flex justify-between items-center p-1 rounded text-xs">
                    <div
                      className="absolute inset-0 bg-red-500 opacity-10 rounded"
                      style={{ width: `${depthPercentage}%` }}
                    />
                    <span className="relative z-10 text-red-400 font-medium">
                      {formatNumber(parseFloat(price))}
                    </span>
                    <span className="relative z-10 text-muted-foreground">
                      {formatNumber(parseFloat(quantity))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Bids (Buy)
            </div>
            <div className="space-y-1">
              {orderBook.bids.slice(0, 10).map((bid, index) => {
                const [price, quantity] = bid
                const depthPercentage = getDepthPercentage(
                  parseFloat(quantity),
                  totalBidQuantity
                )
                return (
                  <div
                    key={index}
                    className="relative flex justify-between items-center p-1 rounded text-xs">
                    <div
                      className="absolute inset-0 bg-green-500 opacity-10 rounded"
                      style={{ width: `${depthPercentage}%` }}
                    />
                    <span className="relative z-10 text-green-400 font-medium">
                      {formatNumber(parseFloat(price))}
                    </span>
                    <span className="relative z-10 text-muted-foreground">
                      {formatNumber(parseFloat(quantity))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Spread Information */}
        <div className="mt-4 pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Best Ask:</span>
                <span className="font-medium text-red-400">
                  {orderBook.asks.length > 0
                    ? formatNumber(parseFloat(orderBook.asks[0][0]))
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Best Bid:</span>
                <span className="font-medium text-green-400">
                  {orderBook.bids.length > 0
                    ? formatNumber(parseFloat(orderBook.bids[0][0]))
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Spread:</span>
                <span className="font-medium text-yellow-400">
                  {orderBook.asks.length > 0 && orderBook.bids.length > 0
                    ? formatNumber(
                        parseFloat(orderBook.asks[0][0]) -
                          parseFloat(orderBook.bids[0][0])
                      )
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bid Depth:</span>
                <span className="font-medium">
                  {orderBook.bids?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ask Depth:</span>
                <span className="font-medium">
                  {orderBook.asks?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Orders:</span>
                <span className="font-medium">
                  {(orderBook.bids?.length || 0) +
                    (orderBook.asks?.length || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
