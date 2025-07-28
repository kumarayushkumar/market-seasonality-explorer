'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FinancialMetrics } from '@/services/api'
import { X } from 'lucide-react'

interface ComparisonPanelProps {
  comparisonPeriods: {
    period1: { year: number; period: string } | null
    period2: { year: number; period: string } | null
  }
  comparisonData: {
    period1: FinancialMetrics | null
    period2: FinancialMetrics | null
  }
  calculateComparisonMetrics: {
    performanceDiff: number
    volatilityDiff: number
    volumeDiff: number
    priceDiff: number
    liquidityDiff: number
  } | null
  onClearComparison: () => void
}

export function ComparisonPanel({
  comparisonPeriods,
  comparisonData,
  calculateComparisonMetrics,
  onClearComparison
}: ComparisonPanelProps) {
  if (!comparisonData.period1 || !comparisonData.period2) return null

  return (
    <Card className="">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Period Comparison
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearComparison}
            className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Period 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-sm">
                Period 1: {comparisonPeriods.period1?.year}{' '}
                {comparisonPeriods.period1?.period}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Performance:</span>
                <div className="font-semibold">
                  {comparisonData.period1.performance > 0 ? '+' : ''}
                  {comparisonData.period1.performance.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Volatility:</span>
                <div className="font-semibold">
                  {comparisonData.period1.volatility.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>
                <div className="font-semibold">
                  ${comparisonData.period1.close.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Volume:</span>
                <div className="font-semibold">
                  {comparisonData.period1.volume.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Period 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h4 className="font-semibold text-sm">
                Period 2: {comparisonPeriods.period2?.year}{' '}
                {comparisonPeriods.period2?.period}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Performance:</span>
                <div className="font-semibold">
                  {comparisonData.period2.performance > 0 ? '+' : ''}
                  {comparisonData.period2.performance.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Volatility:</span>
                <div className="font-semibold">
                  {comparisonData.period2.volatility.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>
                <div className="font-semibold">
                  ${comparisonData.period2.close.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Volume:</span>
                <div className="font-semibold">
                  {comparisonData.period2.volume.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Metrics */}
        {calculateComparisonMetrics && (
          <div className="mt-4 pt-4 border-t">
            <h5 className="font-semibold text-sm mb-3">Comparison Analysis</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="text-center p-2 rounded border">
                <div className="text-muted-foreground">Performance Δ</div>
                <div
                  className={`font-semibold ${calculateComparisonMetrics.performanceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateComparisonMetrics.performanceDiff > 0 ? '+' : ''}
                  {calculateComparisonMetrics.performanceDiff.toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-2 rounded border">
                <div className="text-muted-foreground">Volatility Δ</div>
                <div
                  className={`font-semibold ${calculateComparisonMetrics.volatilityDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {calculateComparisonMetrics.volatilityDiff > 0 ? '+' : ''}
                  {calculateComparisonMetrics.volatilityDiff.toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-2 rounded border">
                <div className="text-muted-foreground">Price Δ</div>
                <div
                  className={`font-semibold ${calculateComparisonMetrics.priceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateComparisonMetrics.priceDiff > 0 ? '+' : ''}
                  {calculateComparisonMetrics.priceDiff.toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-2 rounded border">
                <div className="text-muted-foreground">Volume Δ</div>
                <div
                  className={`font-semibold ${calculateComparisonMetrics.volumeDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateComparisonMetrics.volumeDiff > 0 ? '+' : ''}
                  {calculateComparisonMetrics.volumeDiff.toFixed(2)}%
                </div>
              </div>
              <div className="text-center p-2 rounded border">
                <div className="text-muted-foreground">Liquidity Δ</div>
                <div
                  className={`font-semibold ${calculateComparisonMetrics.liquidityDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateComparisonMetrics.liquidityDiff > 0 ? '+' : ''}
                  {calculateComparisonMetrics.liquidityDiff.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
