import { useState, useEffect, useCallback } from 'react'
import { transpileCode } from '../utils/transpileCode'

export interface UseLivePreviewOptions {
  code: string
  debounceMs?: number
}

export function useLivePreview({ code, debounceMs = 300 }: UseLivePreviewOptions) {
  const [transpiledCode, setTranspiledCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isTranspiling, setIsTranspiling] = useState(false)

  const transpile = useCallback((sourceCode: string) => {
    setIsTranspiling(true)

    // Simulate async to allow debouncing
    setTimeout(() => {
      const result = transpileCode(sourceCode)

      if (result.success && result.code) {
        setTranspiledCode(result.code)
        setError(null)
      } else {
        setError(result.error || 'Unknown transpilation error')
      }

      setIsTranspiling(false)
    }, 0)
  }, [])

  useEffect(() => {
    if (!code) {
      setTranspiledCode('')
      setError(null)
      return
    }

    const timer = setTimeout(() => {
      transpile(code)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [code, debounceMs, transpile])

  return {
    transpiledCode,
    error,
    isTranspiling,
  }
}
