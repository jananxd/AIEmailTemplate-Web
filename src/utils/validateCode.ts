import { transpileCode } from './transpileCode'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateCode(code: string): ValidationResult {
  const errors: string[] = []

  // Check if code is empty
  if (!code.trim()) {
    errors.push('Code cannot be empty')
  }

  // Check for required imports
  if (!code.includes('@react-email/components')) {
    errors.push('Missing import from @react-email/components')
  }

  // Check for export default
  if (!code.includes('export default')) {
    errors.push('Missing default export')
  }

  // Try transpiling to check for syntax errors
  const transpileResult = transpileCode(code)
  if (!transpileResult.success) {
    errors.push(`Syntax error: ${transpileResult.error}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
