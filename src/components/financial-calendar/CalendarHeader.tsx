'use client'

import { Button } from '@/components/ui/button'
import { CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMonthOptions } from '@/utils/helper'
import { getMonth } from 'date-fns'
import {
  BarChart3,
  Bell,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Zap
} from 'lucide-react'

interface CalendarHeaderProps {
  assetInfo: { name: string; symbol: string }
  timeframe: 'daily' | 'weekly' | 'monthly'
  currentDate: Date
  isComparisonMode: boolean
  isExporting: boolean
  customDateRange: { startDate: Date; endDate: Date } | null
  displayDataLength: number
  onTimeframeChange: (timeframe: 'daily' | 'weekly' | 'monthly') => void
  onMonthChange: (monthIndex: string) => void
  onCustomAnalysisClick: () => void
  onClearCustomRange: () => void
  onToggleComparisonMode: () => void
  onExportCSV: () => void
  onExportPDF: () => void
  onAlertSystemClick: () => void
  onHistoricalPatternsClick: () => void
  isAlertSystemOpen: boolean
  isHistoricalPatternsOpen: boolean
}

export function CalendarHeader({
  assetInfo,
  timeframe,
  currentDate,
  isComparisonMode,
  isExporting,
  customDateRange,
  displayDataLength,
  onTimeframeChange,
  onMonthChange,
  onCustomAnalysisClick,
  onClearCustomRange,
  onToggleComparisonMode,
  onExportCSV,
  onExportPDF,
  onAlertSystemClick,
  onHistoricalPatternsClick,
  isAlertSystemOpen,
  isHistoricalPatternsOpen
}: CalendarHeaderProps) {
  return (
    <CardHeader className="pb-3 border-b flex flex-col justify-between w-full gap-3">
      <CardTitle className="text-sm lg:text-lg font-semibold">
        {assetInfo.name} Calendar
      </CardTitle>

      <div className="flex flex-col gap-2 md:gap-8 md:flex-row w-full justify-between">
        <div className="flex gap-2 justify-between">
          <Tabs
            value={timeframe}
            onValueChange={value =>
              onTimeframeChange(value as 'daily' | 'weekly' | 'monthly')
            }
            className="w-auto">
            <TabsList className="h-7 md:h-8 flex">
              <TabsTrigger value="daily" className="text-xs px-3">
                D
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3">
                W
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3">
                M
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Month:</span>
            <Select
              value={getMonth(currentDate).toString()}
              onValueChange={onMonthChange}
              disabled={timeframe !== 'daily'}>
              <SelectTrigger className="text-xs" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map(month => (
                  <SelectItem
                    className="text-xs"
                    key={month.value}
                    value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between flex-wrap gap-4">
          <div className="flex gap-2 max-sm:flex-wrap w-full max-md:justify-between">
            <Button
              variant="default"
              size="sm"
              onClick={onCustomAnalysisClick}
              className="px-3 h-8 text-xs font-medium">
              Custom Analysis
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onClearCustomRange}
              className="h-8 px-3 text-xs font-medium"
              disabled={!customDateRange}>
              Clear Range
            </Button>

            <div className="w-full flex justify-between gap-2">
              <Button
                variant={isComparisonMode ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleComparisonMode}
                className="h-8 px-3 text-xs font-medium">
                <BarChart3 className="w-3 h-3 mr-1" />
                {isComparisonMode ? 'Exit Compare' : 'Compare'}
              </Button>
              <div className="flex justify-end w-full">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportCSV}
                        disabled={isExporting || displayDataLength === 0}
                        className="w-full text-left justify-start">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportPDF}
                        disabled={isExporting || displayDataLength === 0}
                        className="w-full text-left justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Export as PDF
                      </Button>
                      <Button
                        variant={isAlertSystemOpen ? 'default' : 'outline'}
                        size="sm"
                        onClick={onAlertSystemClick}
                        className="w-full text-left justify-start">
                        <Bell className="w-4 h-4 mr-2" />
                        Alerts
                      </Button>
                      <Button
                        variant={
                          isHistoricalPatternsOpen ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={onHistoricalPatternsClick}
                        className="w-full text-left justify-start">
                        <Zap className="w-4 h-4 mr-2" />
                        Patterns
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  )
}
