'use client'

import { VOLATILITY_THRESHOLDS } from '@/utils/constants'

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-6 p-3 bg-muted/50 rounded-sm text-xs">
      {/* Volatility Indicators */}
      <div className="flex flex-col gap-2">
        <div className="font-medium text-muted-foreground">
          Volatility Levels
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-900/30 border-2 border-green-500/50 rounded"></div>
          <span>Low Volatility (≤{VOLATILITY_THRESHOLDS.LOW}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-900/30 border-2 border-yellow-500/50 rounded"></div>
          <span>
            Medium Volatility ({VOLATILITY_THRESHOLDS.LOW}-
            {VOLATILITY_THRESHOLDS.MEDIUM}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-900/30 border-2 border-red-500/50 rounded"></div>
          <span>High Volatility (&gt;{VOLATILITY_THRESHOLDS.MEDIUM}%)</span>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="flex flex-col gap-2">
        <div className="font-medium text-muted-foreground">Performance</div>
        <div className="flex items-center gap-2">
          <span className="text-green-500 font-bold text-sm">↗</span>
          <span>Positive Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold text-sm">↘</span>
          <span>Negative Performance</span>
        </div>
      </div>

      {/* Volume & Liquidity Indicators */}
      <div className="flex flex-col gap-2">
        <div className="font-medium text-muted-foreground">
          Volume & Liquidity
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 relative">
            <svg width="16" height="16" className="transform -rotate-90">
              <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2"
              />
            </svg>
          </div>
          <span>Volume Indicator</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(59, 130, 246, 0.5) 2px, rgba(59, 130, 246, 0.5) 4px)'
            }}></div>
          <span>High Liquidity Pattern</span>
        </div>
      </div>

      {/* Comparison Mode Indicators */}
      <div className="flex flex-col gap-2">
        <div className="font-medium text-muted-foreground">Comparison Mode</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full ring-1 ring-green-500 ring-offset-1 ring-offset-background"></div>
          <span>Period 1 (Selected)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full ring-1 ring-purple-500 ring-offset-1 ring-offset-background"></div>
          <span>Period 2 (Selected)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded opacity-60"></div>
          <span>Available for Selection</span>
        </div>
      </div>
    </div>
  )
}
