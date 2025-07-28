'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { AVAILABLE_SYMBOLS, DEFAULT_SYMBOL } from '@/utils/constants'
import { useState } from 'react'
import { FinancialCalendar } from './financial-calendar/FinancialCalendar'
import { LiveDataPanel } from './LiveDataPanel'

export function FinancialDashboard() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_SYMBOL)

  return (
    <section className="max-w-[1500px] mx-auto p-2 space-y-2">
      <Select value={symbol} onValueChange={setSymbol}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_SYMBOLS.map(symbolItem => (
            <SelectItem key={symbolItem} value={symbolItem}>
              {symbolItem}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col lg:flex-row gap-2">
        <LiveDataPanel className="flex-1" symbol={symbol} />
        <FinancialCalendar symbol={symbol} className="flex-1 min-w-0" />
      </div>
    </section>
  )
}
