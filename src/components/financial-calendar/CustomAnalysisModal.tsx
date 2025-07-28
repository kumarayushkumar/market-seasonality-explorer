'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface CustomAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (startDate: Date, endDate: Date) => void
  availableDataRange: { start: Date; end: Date }
  startDate: Date | undefined
  setStartDate: (date: Date | undefined) => void
  endDate: Date | undefined
  setEndDate: (date: Date | undefined) => void
}

export function CustomAnalysisModal({
  isOpen,
  onClose,
  onApply,
  availableDataRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: CustomAnalysisModalProps) {
  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate)
      onClose()
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset dates
    setStartDate(undefined)
    setEndDate(undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custom Analysis Period</DialogTitle>
          <DialogDescription>
            Select a custom date range for analysis. Available data ranges from{' '}
            {(() => {
              try {
                return format(availableDataRange.start, 'MMM dd, yyyy')
              } catch {
                return 'Jan 01, 2024'
              }
            })()}{' '}
            to{' '}
            {(() => {
              try {
                return format(availableDataRange.end, 'MMM dd, yyyy')
              } catch {
                return 'Dec 31, 2024'
              }
            })()}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={date => {
                      try {
                        return Boolean(
                          date < availableDataRange.start ||
                            date > availableDataRange.end ||
                            (endDate && date > endDate)
                        )
                      } catch {
                        return false
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={date => {
                      try {
                        return Boolean(
                          date < availableDataRange.start ||
                            date > availableDataRange.end ||
                            (startDate && date < startDate)
                        )
                      } catch {
                        return false
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!startDate || !endDate}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
