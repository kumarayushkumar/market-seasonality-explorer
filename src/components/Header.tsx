'use client'

import { BarChart3 } from 'lucide-react'

export function Header() {
  return (
    <header className="max-w-[1500px] mx-auto px-2 w-full border-b flex gap-2 items-center py-2">
      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md">
        <BarChart3 className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-lg font-bold">Financial Dashboard</h1>
        <p className="text-xs text-muted-foreground -mt-1">
          Real-time Market Analytics
        </p>
      </div>
    </header>
  )
}
