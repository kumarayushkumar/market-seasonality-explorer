'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialMetrics } from '@/services/api'
import {
  calculateBenchmarkComparison,
  calculateBollingerBands,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  calculateStandardDeviation,
  calculateVIXLikeMetric,
  createEnhancedChartData
} from '@/utils/helper'
import { format } from 'date-fns'
import {
  Activity,
  BarChart,
  BarChart3,
  DollarSign,
  Gauge,
  LineChart as LineChartIcon,
  Target,
  TrendingDown,
  TrendingUp,
  Volume2,
  Zap
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface DetailedMetricsModalProps {
  isOpen: boolean
  onClose: () => void
  metrics: FinancialMetrics | null
  historicalData?: FinancialMetrics[]
}

export function DetailedMetricsModal({
  isOpen,
  onClose,
  metrics,
  historicalData = []
}: DetailedMetricsModalProps) {
  if (!metrics) return null

  const enhancedChartData = createEnhancedChartData(historicalData)

  const sma20 = calculateSMA(historicalData, 20)
  const sma50 = calculateSMA(historicalData, 50)
  const rsi = calculateRSI(historicalData)
  const macd = calculateMACD(historicalData)
  const bb = calculateBollingerBands(historicalData, 20)

  const stdDev = calculateStandardDeviation(historicalData, 20)
  const vixLike = calculateVIXLikeMetric(historicalData, 20)

  const benchmark = calculateBenchmarkComparison(historicalData, 30)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="px-3 lg:px-6 max-w-6xl max-h-[90vh] overflow-y-auto sm:max-w-auto"
        aria-describedby="detailed-metrics-description">
        <DialogHeader className="pb-2 text-left w-2/3">
          <DialogTitle className="text-sm lg:text-lg font-semibold">
            Comprehensive Financial Dashboard -{' '}
            {metrics.date.includes('-W')
              ? `${metrics.date.split('-W')[0]} Week ${metrics.date.split('-W')[1]}`
              : format(new Date(metrics.date), 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <div id="detailed-metrics-description" className="sr-only">
            Comprehensive financial metrics, technical analysis, and market
            insights for the selected period
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-xs">
              Technical
            </TabsTrigger>
            <TabsTrigger value="volatility" className="text-xs">
              Volatility
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="text-xs">
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-xs">
              Charts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Price Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    ${metrics.close.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge
                      variant={
                        metrics.performance > 0 ? 'default' : 'destructive'
                      }
                      className="text-xs">
                      {metrics.performance > 0 ? '+' : ''}
                      {metrics.performance.toFixed(2)}%
                    </Badge>
                    {metrics.performance > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    Volatility (VIX-like)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">{vixLike.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {vixLike > 30 ? 'High' : vixLike > 20 ? 'Medium' : 'Low'}{' '}
                    Risk
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {metrics.volume > 1000000
                      ? `${(metrics.volume / 1000000).toFixed(1)}M`
                      : metrics.volume > 1000
                        ? `${(metrics.volume / 1000).toFixed(1)}K`
                        : metrics.volume.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Trading Volume
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Liquidity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    ${(metrics.liquidity / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Market Depth</div>
                </CardContent>
              </Card>
            </div>

            {/* Price Details with Enhanced Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Price Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Open</div>
                    <div className="text-base font-semibold">
                      ${metrics.open.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">High</div>
                    <div className="text-base font-semibold text-green-600">
                      ${metrics.high.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Low</div>
                    <div className="text-base font-semibold text-red-600">
                      ${metrics.low.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Close</div>
                    <div className="text-base font-semibold">
                      ${metrics.close.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Additional Price Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-gray-600">Range</div>
                    <div className="text-sm font-medium">
                      ${(metrics.high - metrics.low).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Body</div>
                    <div className="text-sm font-medium">
                      ${Math.abs(metrics.close - metrics.open).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Upper Shadow</div>
                    <div className="text-sm font-medium">
                      $
                      {(
                        metrics.high - Math.max(metrics.open, metrics.close)
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Lower Shadow</div>
                    <div className="text-sm font-medium">
                      $
                      {(
                        Math.min(metrics.open, metrics.close) - metrics.low
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Sentiment */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Market Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Price Action</div>
                      <div className="text-xs text-gray-600">
                        {metrics.close > metrics.open ? 'Bullish' : 'Bearish'}{' '}
                        Candle
                      </div>
                    </div>
                    <Badge
                      variant={
                        metrics.close > metrics.open ? 'default' : 'destructive'
                      }>
                      {metrics.close > metrics.open ? 'BULL' : 'BEAR'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Volume Profile</div>
                      <div className="text-xs text-gray-600">
                        {metrics.volume > 1000000 ? 'High' : 'Normal'} Volume
                      </div>
                    </div>
                    <Badge
                      variant={
                        metrics.volume > 1000000 ? 'default' : 'secondary'
                      }>
                      {metrics.volume > 1000000 ? 'HIGH' : 'NORM'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Liquidity</div>
                      <div className="text-xs text-gray-600">
                        {metrics.liquidity > 10000000 ? 'Excellent' : 'Good'}{' '}
                        Depth
                      </div>
                    </div>
                    <Badge
                      variant={
                        metrics.liquidity > 10000000 ? 'default' : 'secondary'
                      }>
                      {metrics.liquidity > 10000000 ? 'EXC' : 'GOOD'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            {/* Technical Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <LineChartIcon className="w-3 h-3" />
                    SMA 20
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">${sma20.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.close > sma20 ? 'Above' : 'Below'} moving average
                  </div>
                  <Badge
                    variant={metrics.close > sma20 ? 'default' : 'secondary'}
                    className="text-xs mt-1">
                    {metrics.close > sma20 ? 'BULLISH' : 'BEARISH'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <LineChartIcon className="w-3 h-3" />
                    SMA 50
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">${sma50.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.close > sma50 ? 'Above' : 'Below'} moving average
                  </div>
                  <Badge
                    variant={metrics.close > sma50 ? 'default' : 'secondary'}
                    className="text-xs mt-1">
                    {metrics.close > sma50 ? 'BULLISH' : 'BEARISH'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    RSI
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">{rsi.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {rsi > 70
                      ? 'Overbought'
                      : rsi < 30
                        ? 'Oversold'
                        : 'Neutral'}
                  </div>
                  <Badge
                    variant={
                      rsi > 70
                        ? 'destructive'
                        : rsi < 30
                          ? 'default'
                          : 'secondary'
                    }
                    className="text-xs mt-1">
                    {rsi > 70
                      ? 'OVERBOUGHT'
                      : rsi < 30
                        ? 'OVERSOLD'
                        : 'NEUTRAL'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <BarChart className="w-3 h-3" />
                    MACD
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {macd.macd.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Signal: {macd.signal.toFixed(2)}
                  </div>
                  <Badge
                    variant={macd.histogram > 0 ? 'default' : 'secondary'}
                    className="text-xs mt-1">
                    {macd.histogram > 0 ? 'BULLISH' : 'BEARISH'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Bollinger Bands Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Bollinger Bands Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Upper Band</div>
                    <div className="text-base font-semibold text-red-600">
                      ${bb.upper.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">
                      Middle Band (SMA 20)
                    </div>
                    <div className="text-base font-semibold">
                      ${bb.middle.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Lower Band</div>
                    <div className="text-base font-semibold text-green-600">
                      ${bb.lower.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    Position Analysis:
                  </div>
                  <div className="text-xs space-y-1">
                    {metrics.close > bb.upper && (
                      <div className="text-red-600">
                        • Price above upper band - Potential overbought
                        condition
                      </div>
                    )}
                    {metrics.close < bb.lower && (
                      <div className="text-green-600">
                        • Price below lower band - Potential oversold condition
                      </div>
                    )}
                    {metrics.close >= bb.lower && metrics.close <= bb.upper && (
                      <div className="text-blue-600">
                        • Price within bands - Normal trading range
                      </div>
                    )}
                    <div className="text-gray-600">
                      • Bandwidth:{' '}
                      {(((bb.upper - bb.lower) / bb.middle) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Technical Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Moving Averages
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>SMA 20 vs Price:</span>
                        <Badge
                          variant={
                            metrics.close > sma20 ? 'default' : 'secondary'
                          }
                          className="text-xs">
                          {metrics.close > sma20 ? 'BULLISH' : 'BEARISH'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>SMA 50 vs Price:</span>
                        <Badge
                          variant={
                            metrics.close > sma50 ? 'default' : 'secondary'
                          }
                          className="text-xs">
                          {metrics.close > sma50 ? 'BULLISH' : 'BEARISH'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>SMA 20 vs SMA 50:</span>
                        <Badge
                          variant={sma20 > sma50 ? 'default' : 'secondary'}
                          className="text-xs">
                          {sma20 > sma50 ? 'GOLDEN CROSS' : 'DEATH CROSS'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Momentum Indicators
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>RSI Level:</span>
                        <Badge
                          variant={
                            rsi > 70
                              ? 'destructive'
                              : rsi < 30
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs">
                          {rsi.toFixed(0)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>MACD Signal:</span>
                        <Badge
                          variant={macd.histogram > 0 ? 'default' : 'secondary'}
                          className="text-xs">
                          {macd.histogram > 0 ? 'BULLISH' : 'BEARISH'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>BB Position:</span>
                        <Badge
                          variant={
                            metrics.close > bb.upper
                              ? 'destructive'
                              : metrics.close < bb.lower
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs">
                          {metrics.close > bb.upper
                            ? 'OVERBOUGHT'
                            : metrics.close < bb.lower
                              ? 'OVERSOLD'
                              : 'NEUTRAL'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volatility" className="space-y-4">
            {/* Volatility Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Current Volatility
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {metrics.volatility.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    High-Low Range
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    Standard Deviation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">{stdDev.toFixed(2)}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    20-period rolling
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    VIX-like Metric
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">{vixLike.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Annualized volatility
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Volatility Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Volatility Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Risk Assessment
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Current Risk Level:</span>
                        <Badge
                          variant={
                            vixLike > 30
                              ? 'destructive'
                              : vixLike > 20
                                ? 'default'
                                : 'secondary'
                          }>
                          {vixLike > 30
                            ? 'HIGH'
                            : vixLike > 20
                              ? 'MEDIUM'
                              : 'LOW'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Price Range:</span>
                        <span className="text-sm font-medium">
                          ${(metrics.high - metrics.low).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Range %:</span>
                        <span className="text-sm font-medium">
                          {(
                            ((metrics.high - metrics.low) / metrics.close) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Volatility Context
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="font-medium">
                          VIX-like Interpretation:
                        </div>
                        <div className="text-gray-600 mt-1">
                          {vixLike > 30
                            ? 'High market fear and uncertainty. Consider defensive positions.'
                            : vixLike > 20
                              ? 'Moderate volatility. Normal market conditions.'
                              : 'Low volatility. Market complacency may be present.'}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="font-medium">Trading Implications:</div>
                        <div className="text-gray-600 mt-1">
                          {vixLike > 30
                            ? 'Wider stops, smaller position sizes recommended.'
                            : vixLike > 20
                              ? 'Standard risk management applies.'
                              : 'Tight stops, larger position sizes possible.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volatility Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Volatility Trend (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={enhancedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(2)}%`,
                        'Volatility'
                      ]}
                      labelFormatter={label => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="volatility"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmark" className="space-y-4">
            {/* Benchmark Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Asset Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {benchmark.performance > 0 ? '+' : ''}
                    {benchmark.performance.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    30-day return
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Benchmark (S&P 500)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {benchmark.benchmark > 0 ? '+' : ''}
                    {benchmark.benchmark.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    30-day return
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Alpha
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {benchmark.alpha > 0 ? '+' : ''}
                    {benchmark.alpha.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Excess return
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Beta
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-lg font-bold">
                    {benchmark.beta.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Market sensitivity
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Relative Performance
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Outperformance:</span>
                        <Badge
                          variant={
                            benchmark.alpha > 0 ? 'default' : 'secondary'
                          }>
                          {benchmark.alpha > 0 ? 'YES' : 'NO'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Risk Level:</span>
                        <Badge
                          variant={
                            benchmark.beta > 1.5
                              ? 'destructive'
                              : benchmark.beta > 1
                                ? 'default'
                                : 'secondary'
                          }>
                          {benchmark.beta > 1.5
                            ? 'HIGH'
                            : benchmark.beta > 1
                              ? 'MEDIUM'
                              : 'LOW'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Sharpe Ratio:</span>
                        <span className="text-sm font-medium">
                          {(benchmark.alpha / stdDev).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Investment Insights
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="font-medium">Alpha Analysis:</div>
                        <div className="text-gray-600 mt-1">
                          {benchmark.alpha > 0
                            ? 'Asset outperforming benchmark. Strong relative performance.'
                            : 'Asset underperforming benchmark. Consider rebalancing.'}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="font-medium">Beta Analysis:</div>
                        <div className="text-gray-600 mt-1">
                          {benchmark.beta > 1
                            ? 'Higher volatility than market. Amplified movements.'
                            : 'Lower volatility than market. Defensive characteristics.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            {/* Enhanced Price Chart with Technical Indicators */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs lg:text-sm">
                  Price Chart with Technical Indicators (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={enhancedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `$${value.toFixed(2)}`,
                        name
                      ]}
                      labelFormatter={label => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                      name="Price"
                    />
                    <Line
                      type="monotone"
                      dataKey="sma20"
                      stroke="#10b981"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="SMA 20"
                    />
                    <Line
                      type="monotone"
                      dataKey="sma50"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="SMA 50"
                    />
                    <Line
                      type="monotone"
                      dataKey="bbUpper"
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="BB Upper"
                    />
                    <Line
                      type="monotone"
                      dataKey="bbLower"
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="BB Lower"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volume Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Volume Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={enhancedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        'Volume'
                      ]}
                      labelFormatter={label => `Date: ${label}`}
                    />
                    <Bar dataKey="volume" fill="#10b981" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
