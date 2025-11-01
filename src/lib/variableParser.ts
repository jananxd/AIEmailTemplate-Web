/**
 * Extract all variables from text (e.g., "Hello {{name}}" -> ["name"])
 */
export function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const matches = text.matchAll(regex)
  return Array.from(matches, m => m[1])
}

/**
 * Replace variables in text with actual values
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] ?? match
  })
}
