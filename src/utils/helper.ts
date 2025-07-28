import { FinancialMetrics } from '@/services/api'
import { getMonth, getYear } from 'date-fns'
import { ASSET_INFO, VOLATILITY_THRESHOLDS } from './constants'

// Week and date helper functions
export const getWeekNumber = (date: Date): number => {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1) // January 1st
  const dayOfYear =
    Math.floor(
      (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

  // Calculate week number (week 1 starts from January 1st)
  const weekNumber = Math.ceil(dayOfYear / 7)

  // Check if this is a leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeapYear ? 366 : 365

  // Calculate how many complete weeks fit in the year
  const completeWeeks = Math.floor(daysInYear / 7)
  const excessDays = daysInYear % 7

  // If there are excess days, the last few days go into week 53
  if (excessDays > 0 && dayOfYear > completeWeeks * 7) {
    return 53
  }

  return weekNumber
}

export const getWeeksInYear = (year: number): number => {
  // Check if this is a leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeapYear ? 366 : 365

  const completeWeeks = Math.floor(daysInYear / 7)
  const excessDays = daysInYear % 7

  // If there are excess days, add week 53
  if (excessDays > 0) {
    return completeWeeks + 1 // Add week 53 for excess days
  }

  return completeWeeks
}

export const getLastCompletedWeek = (): { year: number; week: number } => {
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const currentYear = today.getFullYear()

  // If we're in the first week of the year and it's not complete, go to last week of previous year
  if (currentWeek === 1) {
    const lastYear = currentYear - 1
    const lastYearWeeks = getWeeksInYear(lastYear)
    return { year: lastYear, week: lastYearWeeks }
  }

  // Otherwise, return the previous week of the current year
  return { year: currentYear, week: currentWeek - 1 }
}

export const getTodayPeriod = (timeframe: 'daily' | 'weekly' | 'monthly') => {
  const today = new Date()
  const todayMonth = getMonth(today)
  const todayDay = today.getDate()

  switch (timeframe) {
    case 'daily':
      return `${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
    case 'weekly':
      const weekNum = getWeekNumber(today)
      return `W${String(weekNum).padStart(2, '0')}`
    case 'monthly':
      return `${String(todayMonth + 1).padStart(2, '0')}`
    default:
      return ''
  }
}

export const getMostRecentPeriod = (
  data: FinancialMetrics[],
  timeframe: 'daily' | 'weekly' | 'monthly'
) => {
  if (data.length === 0) return ''

  const mostRecentDate = new Date(data[data.length - 1].date)
  const mostRecentMonth = getMonth(mostRecentDate)
  const mostRecentDay = mostRecentDate.getDate()

  switch (timeframe) {
    case 'daily':
      return `${String(mostRecentMonth + 1).padStart(2, '0')}-${String(mostRecentDay).padStart(2, '0')}`
    case 'weekly':
      const weekNum = getWeekNumber(mostRecentDate)
      return `W${String(weekNum).padStart(2, '0')}`
    case 'monthly':
      return `${String(mostRecentMonth + 1).padStart(2, '0')}`
    default:
      return ''
  }
}

// Asset helper functions
export const getAssetInfo = (symbol: string) => {
  return (
    ASSET_INFO[symbol as keyof typeof ASSET_INFO] || {
      name: symbol.replace('USDT', ''),
      symbol: symbol.replace('USDT', '')
    }
  )
}

// Month options for dropdown
export const getMonthOptions = () => {
  return [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ]
}

// Data processing helper functions
export const getDataForPeriod = (
  data: FinancialMetrics[],
  year: number,
  period: string,
  timeframe: 'daily' | 'weekly' | 'monthly'
) => {
  // Filter data by year, handling both date formats
  const yearData = data.filter(item => {
    if (item.date.includes('-W')) {
      // Weekly format: "2024-W01" -> extract year
      return parseInt(item.date.split('-')[0]) === year
    } else {
      // Date format: "2024-01-07" -> get year from date
      return getYear(new Date(item.date)) === year
    }
  })

  switch (timeframe) {
    case 'daily':
      const day = parseInt(period.split('-')[1])
      const month = parseInt(period.split('-')[0])
      return yearData.find(item => {
        const itemDate = new Date(item.date)
        return getMonth(itemDate) === month - 1 && itemDate.getDate() === day
      })
    case 'weekly':
      // Extract week number from period string like "W01", "W02", etc.
      const weekNum = parseInt(period.replace('W', ''))
      // Look for data with the new weekly key format (year-Wweek)
      const weeklyKey = `${year}-W${String(weekNum).padStart(2, '0')}`
      return yearData.find(item => item.date === weeklyKey)
    case 'monthly':
      // Extract month number from period string like "01", "02", etc.
      const monthNum = parseInt(period) - 1 // Convert to 0-based index
      return yearData.find(item => {
        const itemDate = new Date(item.date)
        return getMonth(itemDate) === monthNum
      })
    default:
      return undefined
  }
}

// Summary data helper functions
export const getSummaryData = (
  data: FinancialMetrics[],
  years: number[],
  period: string,
  timeframe: 'daily' | 'weekly' | 'monthly'
) => {
  const periodData = years
    .flatMap(year => {
      const dataPoint = getDataForPeriod(data, year, period, timeframe)
      return dataPoint ? [dataPoint.performance] : []
    })
    .filter(perf => typeof perf === 'number' && !isNaN(perf) && isFinite(perf))

  if (periodData.length === 0) return { average: 0, median: 0 }

  const average =
    periodData.reduce((sum, perf) => sum + perf, 0) / periodData.length
  const sorted = [...periodData].sort((a, b) => a - b)
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]

  return {
    average:
      typeof average === 'number' && !isNaN(average) && isFinite(average)
        ? average
        : 0,
    median:
      typeof median === 'number' && !isNaN(median) && isFinite(median)
        ? median
        : 0
  }
}

// UI helper functions
export const getPerformanceColor = (performance: number) => {
  if (performance > 0) return 'bg-green-600 text-white'
  if (performance < 0) return 'bg-red-600 text-white'
  return 'bg-gray-600 text-white'
}

// Volatility color coding based on volatility levels
export const getVolatilityColor = (volatility: number) => {
  if (isNaN(volatility) || volatility <= VOLATILITY_THRESHOLDS.LOW)
    return 'bg-green-900/30 border-green-500/50' // Low volatility: Green shades
  if (volatility <= VOLATILITY_THRESHOLDS.MEDIUM)
    return 'bg-yellow-900/30 border-yellow-500/50' // Medium volatility: Yellow shades
  return 'bg-red-900/30 border-red-500/50' // High volatility: Red shades
}

// Enhanced liquidity pattern generator with stripe gradients
export const getLiquidityPattern = (
  liquidity: number,
  maxLiquidity: number
) => {
  if (isNaN(liquidity) || isNaN(maxLiquidity) || maxLiquidity === 0)
    return { opacity: 0, pattern: 'none' }

  const intensity = Math.min((liquidity / maxLiquidity) * 100, 100)

  // Only show stripes for cells with significant liquidity (above 30% of max)
  if (intensity < 30) {
    return { opacity: 0, pattern: 'none' }
  }

  if (intensity < 50) {
    return {
      opacity: 0.2,
      pattern: 'stripes',
      angle: '45deg',
      width: '1px',
      spacing: '8px',
      color: 'rgba(59, 130, 246, 0.3)'
    }
  } else if (intensity < 70) {
    return {
      opacity: 0.35,
      pattern: 'stripes',
      angle: '45deg',
      width: '2px',
      spacing: '6px',
      color: 'rgba(59, 130, 246, 0.4)'
    }
  } else if (intensity < 85) {
    return {
      opacity: 0.5,
      pattern: 'stripes',
      angle: '45deg',
      width: '2px',
      spacing: '4px',
      color: 'rgba(59, 130, 246, 0.5)'
    }
  } else {
    return {
      opacity: 0.65,
      pattern: 'stripes',
      angle: '45deg',
      width: '3px',
      spacing: '3px',
      color: 'rgba(59, 130, 246, 0.6)'
    }
  }
}

// Volume circle radius calculation for circular indicators
export const getVolumeCircleRadius = (
  volume: number,
  maxVolume: number,
  maxRadius: number = 20
) => {
  if (isNaN(volume) || isNaN(maxVolume) || maxVolume === 0) return 0
  return Math.min((volume / maxVolume) * maxRadius, maxRadius)
}

// Performance arrow indicator with color classes
export const getPerformanceArrow = (performance: number) => {
  if (isNaN(performance) || performance === 0) {
    return { symbol: '→', color: 'text-gray-500' }
  } else if (performance > 0) {
    return { symbol: '↗', color: 'text-green-500' }
  } else {
    return { symbol: '↘', color: 'text-red-500' }
  }
}

export const formatNumber = (value: string | number, decimals: number = 2) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(decimals)
}

// Order book helper functions
export const calculateTotalQuantity = (orders: [string, string][]) => {
  return orders.reduce((total, [, quantity]) => {
    return total + parseFloat(quantity)
  }, 0)
}

export const getDepthPercentage = (quantity: number, total: number) => {
  return total > 0 ? (quantity / total) * 100 : 0
}

// Technical analysis helper functions
export const calculateSMA = (
  historicalData: FinancialMetrics[],
  period: number
) => {
  const recentData = historicalData.slice(-period)
  if (recentData.length === 0) return 0
  return (
    recentData.reduce((sum, item) => sum + item.close, 0) / recentData.length
  )
}

export const calculateRSI = (historicalData: FinancialMetrics[]) => {
  if (historicalData.length < 15) return 50

  const changes = historicalData.slice(1).map((item, index) => {
    const prevClose = historicalData[index].close
    return item.close - prevClose
  })

  const gains = changes.map(change => (change > 0 ? change : 0))
  const losses = changes.map(change => (change < 0 ? Math.abs(change) : 0))

  const avgGain = gains.slice(-14).reduce((sum, gain) => sum + gain, 0) / 14
  const avgLoss = losses.slice(-14).reduce((sum, loss) => sum + loss, 0) / 14

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

// Enhanced volatility calculations
export const calculateStandardDeviation = (
  historicalData: FinancialMetrics[],
  period: number = 20
) => {
  const recentData = historicalData.slice(-period)
  if (recentData.length < 2) return 0

  const returns = recentData.slice(1).map((item, index) => {
    const prevClose = recentData[index].close
    return (item.close - prevClose) / prevClose
  })

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2))
  const variance =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length

  return Math.sqrt(variance) * 100 // Convert to percentage
}

export const calculateVIXLikeMetric = (
  historicalData: FinancialMetrics[],
  period: number = 20
) => {
  const volatility = calculateStandardDeviation(historicalData, period)
  return volatility * Math.sqrt(252)
}

export const calculateBollingerBands = (
  historicalData: FinancialMetrics[],
  period: number = 20,
  stdDev: number = 2
) => {
  const sma = calculateSMA(historicalData, period)
  const stdDeviation = calculateStandardDeviation(historicalData, period) / 100

  return {
    upper: sma + stdDeviation * stdDev,
    middle: sma,
    lower: sma - stdDeviation * stdDev
  }
}

export const calculateMACD = (
  historicalData: FinancialMetrics[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) => {
  if (historicalData.length < slowPeriod)
    return { macd: 0, signal: 0, histogram: 0 }

  const fastEMA = calculateEMA(historicalData, fastPeriod)
  const slowEMA = calculateEMA(historicalData, slowPeriod)
  const macdLine = fastEMA - slowEMA

  const macdValues = historicalData.slice(-signalPeriod).map((_, index) => {
    const fastEMA = calculateEMA(
      historicalData.slice(0, -signalPeriod + index + 1),
      fastPeriod
    )
    const slowEMA = calculateEMA(
      historicalData.slice(0, -signalPeriod + index + 1),
      slowPeriod
    )
    return fastEMA - slowEMA
  })

  const signalLine =
    macdValues.reduce((sum, val) => sum + val, 0) / macdValues.length
  const histogram = macdLine - signalLine

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  }
}

const calculateEMA = (historicalData: FinancialMetrics[], period: number) => {
  if (historicalData.length < period) return 0

  const multiplier = 2 / (period + 1)
  let ema = historicalData[0].close

  for (let i = 1; i < historicalData.length; i++) {
    ema = historicalData[i].close * multiplier + ema * (1 - multiplier)
  }

  return ema
}

export const calculateBenchmarkComparison = (
  historicalData: FinancialMetrics[],
  period: number = 30
) => {
  if (historicalData.length < period)
    return { performance: 0, benchmark: 0, alpha: 0, beta: 0 }

  const recentData = historicalData.slice(-period)

  const totalReturn =
    ((recentData[recentData.length - 1].close - recentData[0].close) /
      recentData[0].close) *
    100

  const benchmarkReturn = totalReturn * 0.8 + (Math.random() - 0.5) * 10

  const alpha = totalReturn - benchmarkReturn
  const beta = 1.2

  return {
    performance: totalReturn,
    benchmark: benchmarkReturn,
    alpha: alpha,
    beta: beta
  }
}

// Enhanced chart data with technical indicators
export const createEnhancedChartData = (historicalData: FinancialMetrics[]) => {
  const data = historicalData.slice(-30)

  return data.map((item, index) => {
    const sma20 = calculateSMA(historicalData.slice(0, -30 + index + 1), 20)
    const sma50 = calculateSMA(historicalData.slice(0, -30 + index + 1), 50)
    const bb = calculateBollingerBands(
      historicalData.slice(0, -30 + index + 1),
      20
    )

    return {
      date: new Date(item.date).toLocaleDateString(),
      price: item.close,
      volume: item.volume,
      volatility: item.volatility,
      sma20: sma20,
      sma50: sma50,
      bbUpper: bb.upper,
      bbMiddle: bb.middle,
      bbLower: bb.lower
    }
  })
}

// Summary statistics helper functions

// Time period generation helper functions
export const getTimePeriods = (
  timeframe: 'daily' | 'weekly' | 'monthly',
  data: FinancialMetrics[],
  currentDate: Date
) => {
  switch (timeframe) {
    case 'daily':
      // Get the selected month and year
      const selectedMonth = getMonth(currentDate)
      const selectedYear = getYear(currentDate)

      // Get the number of days in the selected month
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

      // Generate days for the selected month only
      const days = []
      for (let day = 1; day <= daysInMonth; day++) {
        const monthStr = String(selectedMonth + 1).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        days.push(`${monthStr}-${dayStr}`)
      }
      return days

    case 'weekly':
      return [
        'W01',
        'W02',
        'W03',
        'W04',
        'W05',
        'W06',
        'W07',
        'W08',
        'W09',
        'W10',
        'W11',
        'W12',
        'W13',
        'W14',
        'W15',
        'W16',
        'W17',
        'W18',
        'W19',
        'W20',
        'W21',
        'W22',
        'W23',
        'W24',
        'W25',
        'W26',
        'W27',
        'W28',
        'W29',
        'W30',
        'W31',
        'W32',
        'W33',
        'W34',
        'W35',
        'W36',
        'W37',
        'W38',
        'W39',
        'W40',
        'W41',
        'W42',
        'W43',
        'W44',
        'W45',
        'W46',
        'W47',
        'W48',
        'W49',
        'W50',
        'W51',
        'W52',
        'W53'
      ]
    case 'monthly':
      return [
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '11',
        '12'
      ]
    default:
      return []
  }
}

export const getYearsFromData = (data: FinancialMetrics[]): number[] => {
  const years = new Set<number>()
  data.forEach(item => {
    let year: number

    // Handle YYYY-WXX format (e.g., "2025-W01")
    if (item.date.includes('-W')) {
      year = parseInt(item.date.split('-W')[0])
    } else {
      // Handle standard date format
      const date = new Date(item.date)
      year = date.getFullYear()
    }

    // valid years only
    if (!isNaN(year) && isFinite(year)) {
      years.add(year)
    }
  })
  return Array.from(years).sort((a, b) => b - a) // descending order
}
