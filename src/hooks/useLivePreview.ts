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
    console.log('useLivePreview: Starting transpilation, code length:', sourceCode?.length)
    setIsTranspiling(true)

    // Simulate async to allow debouncing
    setTimeout(() => {
      const result = transpileCode(sourceCode)

      if (result.success && result.code) {
        console.log('useLivePreview: Transpilation successful, output length:', result.code.length)
        setTranspiledCode(result.code)
        setError(null)
      } else {
        console.error('useLivePreview: Transpilation failed:', result.error)
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
