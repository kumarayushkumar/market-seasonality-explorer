'use client'

import { FinancialMetrics } from '@/services/api'
import { getDataForPeriod, getSummaryData } from '@/utils/helper'
import { CalendarCell } from './CalendarCell'

interface CalendarTableProps {
  displayData: FinancialMetrics[]
  years: number[]
  timePeriods: string[]
  timeframe: 'daily' | 'weekly' | 'monthly'
  maxVolume: number
  maxLiquidity: number
  todayYear: number
  todayPeriod: string
  mostRecentYear: number
  mostRecentPeriod: string
  isComparisonMode: boolean
  comparisonPeriods: {
    period1: { year: number; period: string } | null
    period2: { year: number; period: string } | null
  }
  onCellClick: (year: number, period: string, metrics: FinancialMetrics) => void
}

export function CalendarTable({
  displayData,
  years,
  timePeriods,
  timeframe,
  maxVolume,
  maxLiquidity,
  todayYear,
  todayPeriod,
  mostRecentYear,
  mostRecentPeriod,
  isComparisonMode,
  comparisonPeriods,
  onCellClick
}: CalendarTableProps) {
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 z-20 bg-background px-3 text-center text-xs lg:text-sm font-medium text-muted-foreground border-r shadow-sm">
              Time
            </th>
            {timePeriods.map(period => (
              <th
                key={period}
                className="p-2 text-xs lg:text-sm font-medium text-muted-foreground text-center ">
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Year rows */}
          {years.map(year => (
            <tr key={year} className="border-b hover:bg-muted/50">
              <td className="sticky left-0 z-20 bg-background px-3 text-center text-xs lg:text-sm font-medium border-r shadow-sm">
                {year}
              </td>
              {timePeriods.map(period => {
                const metrics = getDataForPeriod(
                  displayData,
                  year,
                  period,
                  timeframe
                )
                const isToday = year === todayYear && period === todayPeriod
                const isMostRecent =
                  year === mostRecentYear && period === mostRecentPeriod

                const isSelectedForComparison =
                  isComparisonMode &&
                  ((comparisonPeriods.period1?.year === year &&
                    comparisonPeriods.period1?.period === period) ||
                    (comparisonPeriods.period2?.year === year &&
                      comparisonPeriods.period2?.period === period))
                const isPeriod1 =
                  comparisonPeriods.period1?.year === year &&
                  comparisonPeriods.period1?.period === period

                return (
                  <td
                    key={`${year}-${period}`}
                    className="py-2 pl-2 text-center ">
                    {metrics ? (
                      <CalendarCell
                        metrics={metrics}
                        year={year}
                        period={period}
                        maxVolume={maxVolume}
                        maxLiquidity={maxLiquidity}
                        isToday={isToday}
                        isMostRecent={isMostRecent}
                        isComparisonMode={isComparisonMode}
                        isSelectedForComparison={isSelectedForComparison}
                        isPeriod1={isPeriod1}
                        onCellClick={onCellClick}
                      />
                    ) : (
                      <div className="w-full h-10 rounded- border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                        <div className="text-muted-foreground text-xs"> - </div>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}

          {/* Average row */}
          <tr className="border-b bg-muted">
            <td className="sticky left-0 z-20 bg-muted px-3 text-center text-xs lg:text-sm font-medium text-muted-foreground border-r shadow-sm">
              Avg
            </td>
            {timePeriods.map(period => {
              const { average } = getSummaryData(
                displayData,
                years,
                period,
                timeframe
              )
              const isToday = period === todayPeriod
              const isMostRecent = period === mostRecentPeriod
              const shouldHighlight = isToday || isMostRecent
              return (
                <td
                  key={`avg-${period}`}
                  className="py-2 pl-2 text-center bg-muted ">
                  <div
                    className={`relative w-full h-6 rounded-sm border-2 flex items-center mx-auto justify-center ${(() => {
                      const safeAverage =
                        typeof average === 'number' &&
                        !isNaN(average) &&
                        isFinite(average)
                          ? average
                          : 0
                      return safeAverage > 0
                        ? 'bg-green-900/20 border-green-500/30'
                        : safeAverage < 0
                          ? 'bg-red-900/20 border-red-500/30'
                          : 'bg-gray-900/20 border-gray-500/30'
                    })()} ${
                      shouldHighlight
                        ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background'
                        : ''
                    }`}>
                    <div className="text-xs font-medium">
                      {(() => {
                        const safeAverage =
                          typeof average === 'number' &&
                          !isNaN(average) &&
                          isFinite(average)
                            ? average
                            : 0
                        return safeAverage > 0 ? '+' : ''
                      })()}
                      {(() => {
                        const safeAverage =
                          typeof average === 'number' &&
                          !isNaN(average) &&
                          isFinite(average)
                            ? average
                            : 0
                        return safeAverage === 0 ? '-' : safeAverage.toFixed(2)
                      })()}
                      %
                    </div>
                  </div>
                </td>
              )
            })}
          </tr>

          {/* Median row */}
          <tr className="bg-muted">
            <td className="sticky left-0 z-20 bg-muted text-center px-3 text-xs lg:text-sm font-medium text-muted-foreground border-r shadow-sm">
              Med
            </td>
            {timePeriods.map(period => {
              const { median } = getSummaryData(
                displayData,
                years,
                period,
                timeframe
              )
              const isToday = period === todayPeriod
              const isMostRecent = period === mostRecentPeriod
              const shouldHighlight = isToday || isMostRecent
              return (
                <td
                  key={`med-${period}`}
                  className="py-2 pl-2 text-center bg-muted">
                  <div
                    className={`relative w-full h-6 rounded-sm border-2 flex items-center justify-center ${(() => {
                      const safeMedian =
                        typeof median === 'number' &&
                        !isNaN(median) &&
                        isFinite(median)
                          ? median
                          : 0
                      return safeMedian > 0
                        ? 'bg-green-900/20 border-green-500/30'
                        : safeMedian < 0
                          ? 'bg-red-900/20 border-red-500/30'
                          : 'bg-gray-900/20 border-gray-500/30'
                    })()} ${
                      shouldHighlight
                        ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background'
                        : ''
                    }`}>
                    <div className="text-xs font-medium">
                      {(() => {
                        const safeMedian =
                          typeof median === 'number' &&
                          !isNaN(median) &&
                          isFinite(median)
                            ? median
                            : 0
                        return safeMedian > 0 ? '+' : ''
                      })()}
                      {(() => {
                        const safeMedian =
                          typeof median === 'number' &&
                          !isNaN(median) &&
                          isFinite(median)
                            ? median
                            : 0
                        return safeMedian === 0 ? '-' : safeMedian.toFixed(2)
                      })()}
                      %
                    </div>
                  </div>
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
