'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useCalendarData } from '@/hooks/useCalendarData'
import { FinancialMetrics } from '@/services/api'
import { API_CONFIG, DEFAULT_SYMBOL } from '@/utils/constants'
import {
  getAssetInfo,
  getDataForPeriod,
  getMostRecentPeriod,
  getTimePeriods,
  getTodayPeriod,
  getYearsFromData
} from '@/utils/helper'
import { getYear } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { downloadFile, generateCSV, generatePDF } from '../../utils/export'
import { Alert, AlertSystem } from './AlertSystem'
import { CalendarHeader } from './CalendarHeader'
import { CalendarLegend } from './CalendarLegend'
import { CalendarSkeleton } from './CalendarSkeleton'
import { CalendarTable } from './CalendarTable'
import { ComparisonPanel } from './ComparisonPanel'
import { CustomAnalysisModal } from './CustomAnalysisModal'
import { DetailedMetricsModal } from './DetailedMetricsModal'
import { HistoricalPatterns } from './HistoricalPatterns'

interface FinancialCalendarProps {
  symbol?: string
  className?: string
}

export function FinancialCalendar({
  symbol = DEFAULT_SYMBOL,
  className = ''
}: FinancialCalendarProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily'
  )
  const [customDateRange, setCustomDateRange] = useState<{
    startDate: Date
    endDate: Date
  } | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isCustomAnalysisModalOpen, setIsCustomAnalysisModalOpen] =
    useState(false)
  const [selectedMetrics, setSelectedMetrics] =
    useState<FinancialMetrics | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isExporting, setIsExporting] = useState(false)

  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [comparisonPeriods, setComparisonPeriods] = useState<{
    period1: { year: number; period: string } | null
    period2: { year: number; period: string } | null
  }>({
    period1: null,
    period2: null
  })
  const [comparisonData, setComparisonData] = useState<{
    period1: FinancialMetrics | null
    period2: FinancialMetrics | null
  }>({
    period1: null,
    period2: null
  })

  const [isAlertSystemOpen, setIsAlertSystemOpen] = useState(false)

  const [isHistoricalPatternsOpen, setIsHistoricalPatternsOpen] =
    useState(false)

  const { data, loading: calendarLoading } = useCalendarData({
    symbol,
    interval:
      timeframe === 'daily' ? '1d' : timeframe === 'weekly' ? '1w' : '1M',
    limit:
      timeframe === 'daily'
        ? API_CONFIG.DATA_LIMITS.DAILY
        : timeframe === 'weekly'
          ? API_CONFIG.DATA_LIMITS.WEEKLY
          : API_CONFIG.DATA_LIMITS.MONTHLY,
    enableWebSocket: true
  })

  const displayData = useMemo(() => {
    if (!customDateRange || !data.length) {
      return data
    }

    return data.filter(item => {
      try {
        let itemDate: Date

        if (item.date.includes('-W')) {
          const [year, week] = item.date.split('-W')
          const weekNum = parseInt(week)
          const firstDayOfYear = new Date(parseInt(year), 0, 1)
          const daysToAdd = (weekNum - 1) * 7
          itemDate = new Date(
            firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000
          )
        } else if (/^\d{4}-\d{2}$/.test(item.date)) {
          const [year, month] = item.date.split('-')
          itemDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        } else {
          itemDate = new Date(item.date)
        }

        return (
          itemDate >= customDateRange.startDate &&
          itemDate <= customDateRange.endDate
        )
      } catch {
        return false
      }
    })
  }, [data, customDateRange])

  const handleCustomDateRangeChange = useCallback(
    (startDate: Date, endDate: Date) => {
      if (startDate.getTime() === 0) {
        setCustomDateRange(null)
      } else {
        setCustomDateRange({ startDate, endDate })
      }
    },
    []
  )

  const handleTimeframeChange = useCallback(
    (newTimeframe: 'daily' | 'weekly' | 'monthly') => {
      setTimeframe(newTimeframe)
    },
    []
  )

  const handleDateSelect = useCallback(
    (date: string, metrics: FinancialMetrics) => {
      setSelectedMetrics(metrics)
      setIsModalOpen(true)
    },
    []
  )

  const handleMonthChange = useCallback(
    (monthIndex: string) => {
      const newDate = new Date(currentDate)
      newDate.setMonth(parseInt(monthIndex))
      setCurrentDate(newDate)
    },
    [currentDate]
  )

  const handleCustomAnalysisApply = useCallback(
    (startDate: Date, endDate: Date) => {
      handleCustomDateRangeChange?.(startDate, endDate)
    },
    [handleCustomDateRangeChange]
  )

  const handleClearCustomRange = useCallback(() => {
    handleCustomDateRangeChange?.(new Date(0), new Date())
  }, [handleCustomDateRangeChange])

  const handleAlertTrigger = useCallback((alert: Alert) => {
    toast.success(`Alert: ${alert.name}`, {
      description: `Threshold reached for ${alert.type} (${alert.condition} ${alert.threshold})`,
      duration: 5000,
      action: {
        label: 'View Details',
        onClick: () => {}
      }
    })
  }, [])

  const assetInfo = getAssetInfo(symbol)

  const handleExportCSV = useCallback(() => {
    setIsExporting(true)
    try {
      const csvContent = generateCSV(displayData)
      downloadFile(
        csvContent,
        `${symbol}_calendar_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      )
      toast.success('CSV Export Complete', {
        description: `Calendar data exported successfully as ${symbol}_calendar_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`
      })
    } catch {
      toast.error('Export Failed', {
        description: 'Failed to export CSV file. Please try again.'
      })
    } finally {
      setIsExporting(false)
    }
  }, [displayData, symbol, timeframe])

  const handleExportPDF = useCallback(() => {
    setIsExporting(true)
    try {
      const pdf = generatePDF(displayData, timeframe, assetInfo)
      pdf.save(
        `${symbol}_calendar_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`
      )
      toast.success('PDF Export Complete', {
        description: `Calendar data exported successfully as ${symbol}_calendar_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`
      })
    } catch {
      toast.error('Export Failed', {
        description: 'Failed to export PDF file. Please try again.'
      })
    } finally {
      setIsExporting(false)
    }
  }, [displayData, symbol, timeframe, assetInfo])

  const handleToggleComparisonMode = useCallback(() => {
    setIsComparisonMode(!isComparisonMode)
    if (isComparisonMode) {
      setComparisonPeriods({ period1: null, period2: null })
      setComparisonData({ period1: null, period2: null })
      toast.info('Comparison Mode Disabled', {
        description: 'Period comparison has been cleared'
      })
    } else {
      toast.info('Comparison Mode Enabled', {
        description: 'Click on two periods to compare their metrics'
      })
    }
  }, [isComparisonMode])

  const handleSelectComparisonPeriod = useCallback(
    (year: number, period: string) => {
      const metrics = getDataForPeriod(displayData, year, period, timeframe)

      if (!metrics) return

      if (!comparisonPeriods.period1) {
        setComparisonPeriods(prev => ({ ...prev, period1: { year, period } }))
        setComparisonData(prev => ({ ...prev, period1: metrics }))
        toast.success('First Period Selected', {
          description: `${period} ${year} selected for comparison`
        })
      } else if (
        !comparisonPeriods.period2 &&
        !(
          comparisonPeriods.period1.year === year &&
          comparisonPeriods.period1.period === period
        )
      ) {
        setComparisonPeriods(prev => ({ ...prev, period2: { year, period } }))
        setComparisonData(prev => ({ ...prev, period2: metrics }))
        toast.success('Comparison Complete', {
          description: `Comparing ${comparisonPeriods.period1.period} ${comparisonPeriods.period1.year} with ${period} ${year}`
        })
      }
    },
    [comparisonPeriods, displayData, timeframe]
  )

  const handleClearComparison = useCallback(() => {
    setComparisonPeriods({ period1: null, period2: null })
    setComparisonData({ period1: null, period2: null })
    toast.info('Comparison Cleared', {
      description: 'Period comparison has been reset'
    })
  }, [])

  const handleCellClick = useCallback(
    (year: number, period: string, metrics: FinancialMetrics) => {
      if (isComparisonMode) {
        handleSelectComparisonPeriod(year, period)
      } else {
        handleDateSelect(metrics.date, metrics)
      }
    },
    [isComparisonMode, handleSelectComparisonPeriod, handleDateSelect]
  )

  const calculateComparisonMetrics = useMemo(() => {
    if (!comparisonData.period1 || !comparisonData.period2) return null

    const p1 = comparisonData.period1
    const p2 = comparisonData.period2

    return {
      performanceDiff: p2.performance - p1.performance,
      volatilityDiff: p2.volatility - p1.volatility,
      volumeDiff: ((p2.volume - p1.volume) / p1.volume) * 100,
      priceDiff: ((p2.close - p1.close) / p1.close) * 100,
      liquidityDiff: ((p2.liquidity - p1.liquidity) / p1.liquidity) * 100
    }
  }, [comparisonData])

  const years = getYearsFromData(displayData)
  const timePeriods = getTimePeriods(timeframe, displayData, currentDate)
  const todayPeriod = getTodayPeriod(timeframe)
  const mostRecentPeriod = getMostRecentPeriod(displayData, timeframe)
  const todayYear = getYear(new Date())
  const mostRecentYear =
    displayData.length > 0
      ? getYear(new Date(displayData[displayData.length - 1].date))
      : todayYear

  const maxVolume = Math.max(
    ...displayData.map(item =>
      typeof item.volume === 'number' &&
      !isNaN(item.volume) &&
      isFinite(item.volume)
        ? item.volume
        : 0
    ),
    0
  )
  const maxLiquidity = Math.max(
    ...displayData.map(item =>
      typeof item.liquidity === 'number' &&
      !isNaN(item.liquidity) &&
      isFinite(item.liquidity)
        ? item.liquidity
        : 0
    ),
    0
  )

  const availableDataRange = (() => {
    if (displayData.length === 0) {
      return { start: new Date(), end: new Date() }
    }

    const firstItem = displayData[0]
    const lastItem = displayData[displayData.length - 1]

    try {
      if (firstItem.date.includes('-W')) {
        const [year, week] = firstItem.date.split('-W')
        const weekNum = parseInt(week)
        const firstDayOfYear = new Date(parseInt(year), 0, 1)
        const daysToAdd = (weekNum - 1) * 7
        const startDate = new Date(
          firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000
        )

        const [endYear, endWeek] = lastItem.date.split('-W')
        const endWeekNum = parseInt(endWeek)
        const lastDayOfYear = new Date(parseInt(endYear), 0, 1)
        const endDaysToAdd = endWeekNum * 7 - 1
        const endDate = new Date(
          lastDayOfYear.getTime() + endDaysToAdd * 24 * 60 * 60 * 1000
        )

        return { start: startDate, end: endDate }
      } else if (/^\d{4}-\d{2}$/.test(firstItem.date)) {
        const [year, month] = firstItem.date.split('-')
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const [endYear, endMonth] = lastItem.date.split('-')
        const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0)
        return { start: startDate, end: endDate }
      } else {
        const startDate = new Date(firstItem.date)
        const endDate = new Date(lastItem.date)
        return { start: startDate, end: endDate }
      }
    } catch {
      const now = new Date()
      const oneYearAgo = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      )
      return { start: oneYearAgo, end: now }
    }
  })()

  return (
    <Card className={`overflow-x-auto ${className}`}>
      <CalendarHeader
        assetInfo={assetInfo}
        timeframe={timeframe}
        currentDate={currentDate}
        isComparisonMode={isComparisonMode}
        isExporting={isExporting}
        customDateRange={customDateRange}
        displayDataLength={displayData.length}
        onTimeframeChange={handleTimeframeChange}
        onMonthChange={handleMonthChange}
        onCustomAnalysisClick={() => setIsCustomAnalysisModalOpen(true)}
        onClearCustomRange={handleClearCustomRange}
        onToggleComparisonMode={handleToggleComparisonMode}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onAlertSystemClick={() => setIsAlertSystemOpen(!isAlertSystemOpen)}
        onHistoricalPatternsClick={() =>
          setIsHistoricalPatternsOpen(!isHistoricalPatternsOpen)
        }
        isAlertSystemOpen={isAlertSystemOpen}
        isHistoricalPatternsOpen={isHistoricalPatternsOpen}
      />

      <CardContent className="transition-all duration-300 ease-in-out">
        <TooltipProvider>
          {calendarLoading && (
            <div className="transition-opacity duration-300 ease-in-out">
              <CalendarSkeleton timePeriods={timePeriods} />
            </div>
          )}

          {!calendarLoading && displayData.length === 0 && (
            <div className="flex items-center justify-center py-12 transition-opacity duration-300 ease-in-out">
              <div className="text-center">
                <div className="text-muted-foreground text-4xl mb-3">📊</div>
                <p className="text-muted-foreground text-sm">
                  No data available for the selected period
                </p>
              </div>
            </div>
          )}

          {!calendarLoading && displayData.length > 0 && (
            <div className="space-y-4 transition-opacity duration-300 ease-in-out">
              <CalendarTable
                displayData={displayData}
                years={years}
                timePeriods={timePeriods}
                timeframe={timeframe}
                maxVolume={maxVolume}
                maxLiquidity={maxLiquidity}
                todayYear={todayYear}
                todayPeriod={todayPeriod}
                mostRecentYear={mostRecentYear}
                mostRecentPeriod={mostRecentPeriod}
                isComparisonMode={isComparisonMode}
                comparisonPeriods={comparisonPeriods}
                onCellClick={handleCellClick}
              />

              {isComparisonMode &&
                comparisonData.period1 &&
                comparisonData.period2 && (
                  <ComparisonPanel
                    comparisonPeriods={comparisonPeriods}
                    comparisonData={comparisonData}
                    calculateComparisonMetrics={calculateComparisonMetrics}
                    onClearComparison={handleClearComparison}
                  />
                )}

              {isAlertSystemOpen && (
                <AlertSystem
                  symbol={symbol}
                  timeframe={timeframe}
                  currentData={displayData}
                  onAlertTrigger={handleAlertTrigger}
                />
              )}

              {isHistoricalPatternsOpen && (
                <HistoricalPatterns
                  data={displayData}
                  timeframe={timeframe}
                  symbol={symbol}
                />
              )}

              <CalendarLegend />
            </div>
          )}
        </TooltipProvider>
      </CardContent>

      <CustomAnalysisModal
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isOpen={isCustomAnalysisModalOpen}
        onClose={() => setIsCustomAnalysisModalOpen(false)}
        onApply={handleCustomAnalysisApply}
        availableDataRange={availableDataRange}
      />

      <DetailedMetricsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metrics={selectedMetrics}
        historicalData={displayData}
      />
    </Card>
  )
}
