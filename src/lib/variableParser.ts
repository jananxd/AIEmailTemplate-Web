import type { EmailNode } from '../types/email'

/**
 * Extract all variables from text (e.g., "Hello {{name}}" -> ["name"])
 */
export function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const matches = text.matchAll(regex)
  return Array.from(matches, m => m[1])
}

/**
 * Extract all variables from an email JSON structure
 */
export function extractVariablesFromJSON(root: EmailNode): string[] {
  const variables = new Set<string>()

  function traverse(node: EmailNode) {
    if (!node) return

    // Check text fields
    if ('text' in node && node.text) {
      extractVariables(node.text).forEach(v => variables.add(v))
    }

    // Check label fields (buttons)
    if ('label' in node && node.label) {
      extractVariables(node.label).forEach(v => variables.add(v))
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  traverse(root)
  return Array.from(variables)
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
