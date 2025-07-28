import { FinancialMetrics } from '@/services/api'
import {
  detectSimplePatterns,
  SimplePattern
} from '@/utils/simplePatternDetection'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface UsePatternWorkerReturn {
  patterns: SimplePattern[]
  isLoading: boolean
  error: string | null
  processingTime: number | null
  detectPatterns: (
    data: FinancialMetrics[],
    timeframe: 'daily' | 'weekly' | 'monthly'
  ) => void
}

export function usePatternWorker(): UsePatternWorkerReturn {
  const [patterns, setPatterns] = useState<SimplePattern[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef<number | null>(null)
  const useWorkerRef = useRef<boolean>(true)

  // Initialize worker
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      !workerRef.current &&
      useWorkerRef.current
    ) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/patternWorker.ts', import.meta.url),
          {
            type: 'module'
          }
        )

        workerRef.current.onmessage = event => {
          const {
            type,
            patterns: detectedPatterns,
            processingTime: time,
            error: workerError
          } = event.data

          if (type === 'PATTERNS_DETECTED') {
            setPatterns(detectedPatterns)
            setProcessingTime(time)
            setIsLoading(false)
            setError(null)
          } else if (type === 'ERROR') {
            setError(workerError)
            setIsLoading(false)
            setPatterns([])
            toast.error('Pattern Detection Error', {
              description:
                workerError || 'An error occurred while detecting patterns.'
            })
          }
        }

        workerRef.current.onerror = () => {
          setError('Worker error occurred')
          setIsLoading(false)
          setPatterns([])
          useWorkerRef.current = false
          toast.warning('Pattern Detection Fallback', {
            description:
              'Switched to main thread processing for better compatibility.'
          })
        }
      } catch {
        setError('Failed to initialize pattern detection')
        useWorkerRef.current = false
        toast.warning('Pattern Detection Fallback', {
          description:
            'Web Workers not supported. Using main thread processing.'
        })
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const detectPatterns = useCallback(
    (data: FinancialMetrics[], timeframe: 'daily' | 'weekly' | 'monthly') => {
      setIsLoading(true)
      setError(null)
      setPatterns([])
      setProcessingTime(null)

      if (!useWorkerRef.current || !workerRef.current) {
        try {
          const startTime = performance.now()
          const detectedPatterns = detectSimplePatterns(data)
          const time = performance.now() - startTime

          setPatterns(detectedPatterns)
          setProcessingTime(time)
          setIsLoading(false)
        } catch {
          setError('Failed to process patterns')
          setIsLoading(false)
        }
        return
      }

      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current)
      }

      requestIdRef.current = requestAnimationFrame(() => {
        try {
          workerRef.current?.postMessage({
            type: 'DETECT_PATTERNS',
            data: {
              financialData: data,
              timeframe
            }
          })
        } catch {
          setError('Failed to process patterns')
          setIsLoading(false)
          useWorkerRef.current = false
        }
      })
    },
    []
  )

  return {
    patterns,
    isLoading,
    error,
    processingTime,
    detectPatterns
  }
}
