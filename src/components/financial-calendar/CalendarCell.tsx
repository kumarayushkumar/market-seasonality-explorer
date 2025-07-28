'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { FinancialMetrics } from '@/services/api'
import {
  getLiquidityPattern,
  getPerformanceArrow,
  getVolatilityColor,
  getVolumeCircleRadius
} from '@/utils/helper'

interface CalendarCellProps {
  metrics: FinancialMetrics
  year: number
  period: string
  maxVolume: number
  maxLiquidity: number
  isToday: boolean
  isMostRecent: boolean
  isComparisonMode: boolean
  isSelectedForComparison: boolean
  isPeriod1: boolean
  onCellClick: (year: number, period: string, metrics: FinancialMetrics) => void
}

export function CalendarCell({
  metrics,
  year,
  period,
  maxVolume,
  maxLiquidity,
  isToday,
  isMostRecent,
  isComparisonMode,
  isSelectedForComparison,
  isPeriod1,
  onCellClick
}: CalendarCellProps) {
  const shouldHighlight = isToday || isMostRecent

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`relative w-full h-10 rounded-sm border-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 overflow-hidden ${getVolatilityColor(metrics.volatility)} ${
            shouldHighlight
              ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background'
              : ''
          } ${
            isSelectedForComparison
              ? isPeriod1
                ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background'
                : 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background'
              : ''
          } ${
            isComparisonMode && !isSelectedForComparison
              ? 'opacity-60 hover:opacity-100'
              : ''
          }`}
          onClick={() => onCellClick(year, period, metrics)}>
          {(() => {
            const pattern = getLiquidityPattern(metrics.liquidity, maxLiquidity)
            if (pattern.pattern === 'stripes') {
              return (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(${pattern.angle}, transparent, transparent ${pattern.spacing}, ${pattern.color} ${pattern.spacing}, ${pattern.color} calc(${pattern.spacing} + ${pattern.width}))`
                  }}
                />
              )
            }
            return null
          })()}

          <div className="relative z-10 gap-1 flex items-center lg:justify-between h-full px-2">
            <div className="flex items-center">
              {(() => {
                const arrow = getPerformanceArrow(metrics.performance)
                return (
                  <div className={`text-sm font-bold ${arrow.color}`}>
                    {arrow.symbol}
                  </div>
                )
              })()}
            </div>

            <div className="flex-1 text-center">
              {(() => {
                const safePerformance =
                  typeof metrics.performance === 'number' &&
                  !isNaN(metrics.performance) &&
                  isFinite(metrics.performance)
                    ? metrics.performance
                    : 0
                const displayPerformance =
                  safePerformance === 0 ? '-' : safePerformance.toFixed(1)

                return (
                  <div className="text-xs font-semibold">
                    {safePerformance > 0 ? '+' : ''}
                    {displayPerformance}%
                  </div>
                )
              })()}
            </div>

            <div className="flex items-center">
              <div className="w-4 h-4 relative">
                <svg width="16" height="16" className="transform -rotate-90">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="rgba(20, 130, 255,1)"
                    strokeWidth="2"
                    strokeDasharray={`${getVolumeCircleRadius(metrics.volume, maxVolume, 8) * 2 * Math.PI} ${2 * Math.PI * 8}`}
                    strokeDashoffset="0"
                    className="transition-all duration-300"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2 text-xs">
          <div className="font-semibold">
            {period} {year}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Performance:</span>
              <br />
              {(() => {
                const safePerformance =
                  typeof metrics.performance === 'number' &&
                  !isNaN(metrics.performance) &&
                  isFinite(metrics.performance)
                    ? metrics.performance
                    : 0
                return safePerformance > 0 ? '+' : ''
              })()}
              {(() => {
                const safePerformance =
                  typeof metrics.performance === 'number' &&
                  !isNaN(metrics.performance) &&
                  isFinite(metrics.performance)
                    ? metrics.performance
                    : 0
                return safePerformance === 0 ? '-' : safePerformance.toFixed(2)
              })()}
              %
            </div>
            <div>
              <span className="font-medium">Volatility:</span>
              <br />
              {(() => {
                const safeVolatility =
                  typeof metrics.volatility === 'number' &&
                  !isNaN(metrics.volatility) &&
                  isFinite(metrics.volatility)
                    ? metrics.volatility
                    : 0
                return safeVolatility === 0 ? '-' : safeVolatility.toFixed(2)
              })()}
              %
            </div>
            <div>
              <span className="font-medium">Price:</span>
              <br />$
              {(() => {
                const safeClose =
                  typeof metrics.close === 'number' &&
                  !isNaN(metrics.close) &&
                  isFinite(metrics.close)
                    ? metrics.close
                    : 0
                return safeClose === 0 ? '-' : safeClose.toFixed(2)
              })()}
            </div>
            <div>
              <span className="font-medium">Volume:</span>
              <br />
              {(() => {
                const safeVolume =
                  typeof metrics.volume === 'number' &&
                  !isNaN(metrics.volume) &&
                  isFinite(metrics.volume)
                    ? metrics.volume
                    : 0
                return safeVolume === 0 ? '-' : safeVolume.toLocaleString()
              })()}
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
