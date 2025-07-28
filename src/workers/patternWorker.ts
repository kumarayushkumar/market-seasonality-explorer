interface FinancialMetrics {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  volatility: number
  liquidity: number
  performance: number
}

interface SimplePattern {
  id: string
  type: 'seasonal' | 'trend' | 'anomaly'
  name: string
  description: string
  confidence: number
  period: string
  metrics: {
    performance: number
    volatility: number
    volume: number
    price: number
  }
  historicalOccurrences: number
  lastOccurrence?: string
  strength: 'weak' | 'moderate' | 'strong'
  color: string
}

interface WorkerMessage {
  type: 'DETECT_PATTERNS'
  data: {
    financialData: FinancialMetrics[]
    timeframe: 'daily' | 'weekly' | 'monthly'
  }
}

interface WorkerResponse {
  type: 'PATTERNS_DETECTED'
  patterns: SimplePattern[]
  processingTime: number
}

// Helper functions
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  return (
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  )
}

function calculateLinearRegression(values: number[]): number {
  const n = values.length
  const indices = Array.from({ length: n }, (_, i) => i)

  const sumX = indices.reduce((sum, x) => sum + x, 0)
  const sumY = values.reduce((sum, y) => sum + y, 0)
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

function detectMonthlyPatterns(data: FinancialMetrics[]): SimplePattern[] {
  const patterns: SimplePattern[] = []
  const monthlyData: Record<number, FinancialMetrics[]> = {}

  // Group data by month
  data.forEach(item => {
    const month = new Date(item.date).getMonth() + 1
    if (!monthlyData[month]) monthlyData[month] = []
    monthlyData[month].push(item)
  })

  // Analyze each month
  Object.entries(monthlyData).forEach(([month, monthData]) => {
    if (monthData.length >= 3) {
      const avgPerformance =
        monthData.reduce((sum, d) => sum + d.performance, 0) / monthData.length
      const avgVolatility =
        monthData.reduce((sum, d) => sum + d.volatility, 0) / monthData.length
      const avgVolume =
        monthData.reduce((sum, d) => sum + d.volume, 0) / monthData.length
      const avgPrice =
        monthData.reduce((sum, d) => sum + d.close, 0) / monthData.length

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]

      // Calculate confidence based on consistency
      const performanceVariance = calculateVariance(
        monthData.map(d => d.performance)
      )
      const confidence = Math.max(0, 1 - performanceVariance / 100)

      if (confidence >= 0.3) {
        const strength =
          confidence > 0.7 ? 'strong' : confidence > 0.5 ? 'moderate' : 'weak'
        const color = avgPerformance > 0 ? '#10b981' : '#ef4444'

        patterns.push({
          id: `seasonal-${month}`,
          type: 'seasonal',
          name: `${monthNames[parseInt(month) - 1]} Pattern`,
          description: `Recurring pattern in ${monthNames[parseInt(month) - 1]} with ${avgPerformance > 0 ? 'positive' : 'negative'} performance`,
          confidence,
          period: monthNames[parseInt(month) - 1],
          metrics: {
            performance: avgPerformance,
            volatility: avgVolatility,
            volume: avgVolume,
            price: avgPrice
          },
          historicalOccurrences: monthData.length,
          lastOccurrence: monthData[monthData.length - 1]?.date,
          strength,
          color
        })
      }
    }
  })

  return patterns
}

function detectTrendPatterns(data: FinancialMetrics[]): SimplePattern[] {
  const patterns: SimplePattern[] = []

  if (data.length < 10) return patterns

  // Analyze recent trend (last 30 periods)
  const recentData = data.slice(-30)
  const prices = recentData.map(d => d.close)

  // Calculate linear trend
  const slope = calculateLinearRegression(prices)
  const avgPerformance =
    recentData.reduce((sum, d) => sum + d.performance, 0) / recentData.length
  const avgVolatility =
    recentData.reduce((sum, d) => sum + d.volatility, 0) / recentData.length
  const avgVolume =
    recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length

  const direction =
    slope > 0.01 ? 'upward' : slope < -0.01 ? 'downward' : 'sideways'
  const confidence = Math.min(1, Math.abs(slope) * 100)
  const strength =
    confidence > 0.7 ? 'strong' : confidence > 0.5 ? 'moderate' : 'weak'
  const color =
    direction === 'upward'
      ? '#10b981'
      : direction === 'downward'
        ? '#ef4444'
        : '#6b7280'

  patterns.push({
    id: 'trend-recent',
    type: 'trend',
    name: `${direction.charAt(0).toUpperCase() + direction.slice(1)} Trend`,
    description: `${direction} price trend detected in recent data`,
    confidence,
    period: 'Recent 30 periods',
    metrics: {
      performance: avgPerformance,
      volatility: avgVolatility,
      volume: avgVolume,
      price: prices[prices.length - 1]
    },
    historicalOccurrences: 1,
    lastOccurrence: recentData[recentData.length - 1]?.date,
    strength,
    color
  })

  return patterns
}

function detectAnomalyPatterns(data: FinancialMetrics[]): SimplePattern[] {
  const patterns: SimplePattern[] = []

  if (data.length < 20) return patterns

  // Calculate statistical measures for performance
  const performances = data.map(d => d.performance)
  const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length
  const std = Math.sqrt(
    performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
      performances.length
  )

  // Find anomalies (z-score > 2)
  data.forEach((item, index) => {
    const zScore = Math.abs((item.performance - mean) / std)

    if (zScore > 2) {
      const deviation = ((item.performance - mean) / mean) * 100
      const strength = zScore > 3 ? 'strong' : 'moderate'
      const color = Math.abs(deviation) > 50 ? '#dc2626' : '#ea580c'

      patterns.push({
        id: `anomaly-${index}`,
        type: 'anomaly',
        name: 'Performance Anomaly',
        description: `Unusual performance: ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}% deviation`,
        confidence: Math.min(1, zScore / 4),
        period: item.date,
        metrics: {
          performance: item.performance,
          volatility: item.volatility,
          volume: item.volume,
          price: item.close
        },
        historicalOccurrences: 1,
        lastOccurrence: item.date,
        strength,
        color
      })
    }
  })

  return patterns
}

function detectSimplePatterns(data: FinancialMetrics[]): SimplePattern[] {
  const patterns: SimplePattern[] = []

  if (data.length < 20) return patterns

  // Detect seasonal patterns (monthly)
  const seasonalPatterns = detectMonthlyPatterns(data)
  patterns.push(...seasonalPatterns)

  // Detect trend patterns
  const trendPatterns = detectTrendPatterns(data)
  patterns.push(...trendPatterns)

  // Detect anomalies
  const anomalyPatterns = detectAnomalyPatterns(data)
  patterns.push(...anomalyPatterns)

  return patterns.sort((a, b) => b.confidence - a.confidence)
}

// Worker message handler
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data

  if (type === 'DETECT_PATTERNS') {
    const startTime = performance.now()

    try {
      const patterns = detectSimplePatterns(data.financialData)
      const processingTime = performance.now() - startTime

      const response: WorkerResponse = {
        type: 'PATTERNS_DETECTED',
        patterns,
        processingTime
      }

      self.postMessage(response)
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }
})

// TypeScript worker context
export {}
