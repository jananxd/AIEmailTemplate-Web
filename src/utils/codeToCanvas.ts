/**
 * JSX to Canvas parsing is now handled by the backend.
 *
 * The backend provides a PATCH /emails/:id endpoint that accepts jsx_source
 * and returns the parsed json_state.
 *
 * This file is kept for backward compatibility but should not be used.
 */

export interface ParseResult {
  success: boolean
  blocks?: any[]
  error?: string
}

/**
 * @deprecated Use backend API endpoint instead: PATCH /emails/:id with { jsx_source }
 */
export function codeToCanvas(_code: string): ParseResult {
  console.warn('codeToCanvas is deprecated. Backend handles JSX parsing now.')

  return {
    success: true,
    blocks: [],
    error: undefined,
  }
}
