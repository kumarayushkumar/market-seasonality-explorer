'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePatternWorker } from '@/hooks/usePatternWorker'
import { FinancialMetrics } from '@/services/api'
import { SimplePattern } from '@/utils/simplePatternDetection'
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  TrendingUp,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface HistoricalPatternsProps {
  data: FinancialMetrics[]
  timeframe: 'daily' | 'weekly' | 'monthly'
  symbol: string
}

export function HistoricalPatterns({
  data,
  timeframe
}: HistoricalPatternsProps) {
  const [activeTab, setActiveTab] = useState('all')

  const { patterns, isLoading, error, processingTime, detectPatterns } =
    usePatternWorker()

  useEffect(() => {
    if (data.length >= 20) {
      detectPatterns(data, timeframe)
    }
  }, [data, timeframe, detectPatterns])

  useEffect(() => {
    if (patterns.length > 0 && !isLoading && processingTime) {
      toast.success('Patterns Detected', {
        description: `Found ${patterns.length} patterns in ${processingTime.toFixed(0)}ms`
      })
    }
  }, [patterns.length, isLoading, processingTime])

  const seasonalPatterns = patterns.filter(p => p.type === 'seasonal')
  const trendPatterns = patterns.filter(p => p.type === 'trend')
  const anomalyPatterns = patterns.filter(p => p.type === 'anomaly')

  if (data.length < 20) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Historical Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground text-4xl mb-3">📊</div>
            <p className="text-muted-foreground text-sm">
              Need at least 20 data points to detect patterns
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Historical Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-3">⚠️</div>
            <p className="text-red-600 text-sm font-medium">
              Error detecting patterns
            </p>
            <p className="text-muted-foreground text-xs mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Historical Patterns
          <Badge variant="secondary" className="ml-2">
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              patterns.length
            )}
            {isLoading ? ' detecting...' : ' detected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Analyzing patterns in background...
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="all">All ({patterns.length})</TabsTrigger>
              <TabsTrigger value="seasonal">
                Seasonal ({seasonalPatterns.length})
              </TabsTrigger>
              <TabsTrigger value="trends">
                Trends ({trendPatterns.length})
              </TabsTrigger>
              <TabsTrigger value="anomalies">
                Anomalies ({anomalyPatterns.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto max-h-[60vh] mt-4">
              <TabsContent value="all" className="space-y-4 h-full">
                {patterns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-4xl mb-3">
                      🔍
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No significant patterns detected in the current data
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {patterns.map(pattern => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="seasonal" className="space-y-4 h-full">
                {seasonalPatterns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-4xl mb-3">
                      📅
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No seasonal patterns detected
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {seasonalPatterns.map(pattern => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trends" className="space-y-4 h-full">
                {trendPatterns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-4xl mb-3">
                      📈
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No trend patterns detected
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {trendPatterns.map(pattern => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="anomalies" className="space-y-4 h-full">
                {anomalyPatterns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-4xl mb-3">
                      ⚠️
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No anomalies detected
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {anomalyPatterns.map(pattern => (
                      <PatternCard key={pattern.id} pattern={pattern} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function PatternCard({ pattern }: { pattern: SimplePattern }) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'weak':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600'
    if (confidence >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'seasonal':
        return <Calendar className="w-4 h-4" />
      case 'trend':
        return <TrendingUp className="w-4 h-4" />
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  return (
    <Card className="border-l-1" style={{ borderLeftColor: pattern.color }}>
      <CardContent className="px-2">
        <div className="flex flex-col sm:flex-row gap-2 items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-sm bg-muted">
              {getPatternIcon(pattern.type)}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{pattern.name}</h4>
              <p className="text-xs text-muted-foreground">
                {pattern.description}
              </p>
            </div>
          </div>
          <div className="flex items-center pl-6 gap-2">
            <Badge
              variant="outline"
              className={`text-xs ${getStrengthColor(pattern.strength)}`}>
              {pattern.strength}
            </Badge>
            <div
              className={`text-xs font-medium ${getConfidenceColor(pattern.confidence)}`}>
              {(pattern.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="mt-3 grid pl-6 md:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Performance:</span>
            <span
              className={`ml-1 font-medium ${pattern.metrics.performance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pattern.metrics.performance > 0 ? '+' : ''}
              {pattern.metrics.performance.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Volatility:</span>
            <span className="ml-1 font-medium">
              {pattern.metrics.volatility.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Occurrences:</span>
            <span className="ml-1 font-medium">
              {pattern.historicalOccurrences}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Period:</span>
            <span className="ml-1 font-medium">{pattern.period}</span>
          </div>
        </div>

        {pattern.lastOccurrence && (
          <div className="mt-3 pl-6 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            Last: {new Date(pattern.lastOccurrence).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
