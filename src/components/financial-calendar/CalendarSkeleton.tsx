'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface CalendarSkeletonProps {
  timePeriods: string[]
}

export function CalendarSkeleton({ timePeriods }: CalendarSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Legend Skeleton */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-sm">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-20 bg-background text-center font-medium text-muted-foreground border-r shadow-sm">
                <Skeleton className="w-12 h-4 rounded" />
              </th>
              {timePeriods.map(period => (
                <th
                  key={period}
                  className="p-3 text-sm font-medium text-muted-foreground text-center min-w-[120px]">
                  <Skeleton className="w-8 h-4 rounded mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Year rows skeleton */}
            {[...Array(3)].map((_, yearIndex) => (
              <tr key={yearIndex} className="border-b">
                <td className="sticky left-0 z-20 bg-background font-medium border-r shadow-sm">
                  <Skeleton className="w-12 h-4 rounded" />
                </td>
                {timePeriods.map((_, periodIndex) => (
                  <td
                    key={periodIndex}
                    className="p-3 text-center min-w-[120px]">
                    <Skeleton className="w-full h-10 rounded-sm" />
                  </td>
                ))}
              </tr>
            ))}

            {/* Average row skeleton */}
            <tr className="border-b bg-muted">
              <td className="sticky left-0 z-20 bg-muted font-medium text-muted-foreground border-r shadow-sm">
                <Skeleton className="rounded" />
              </td>
              {timePeriods.map((_, periodIndex) => (
                <td key={periodIndex} className="p-2 text-center bg-muted">
                  <Skeleton className="w-full h-6 rounded-sm" />
                </td>
              ))}
            </tr>

            {/* Median row skeleton */}
            <tr className="bg-muted">
              <td className="sticky left-0 z-20 bg-muted font-medium text-muted-foreground border-r shadow-sm">
                <Skeleton className="w-14 h-4 rounded" />
              </td>
              {timePeriods.map((_, periodIndex) => (
                <td key={periodIndex} className="p-2 text-center bg-muted">
                  <Skeleton className="w-full h-6 rounded-sm" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
