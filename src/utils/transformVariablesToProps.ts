/**
 * Transform {{variableName}} syntax in JSX to {props.variableName}
 * This allows Code view to handle variable placeholders without runtime errors
 */

/**
 * Extract all {{variableName}} patterns from code
 */
export function extractVariablesFromCode(code: string): string[] {
  const variablePattern = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()

  let match
  while ((match = variablePattern.exec(code)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

/**
 * Transform {{variableName}} to {variableName} in JSX code
 * Also updates function signature to accept destructured props
 */
export function transformVariablesToProps(code: string): {
  transformedCode: string
  variables: string[]
} {
  const variables = extractVariablesFromCode(code)

  if (variables.length === 0) {
    return { transformedCode: code, variables: [] }
  }

  let transformedCode = code

  // Step 1: Transform {{variableName}} to {variableName}
  for (const varName of variables) {
    const pattern = new RegExp(`\\{\\{${varName}\\}\\}`, 'g')
    transformedCode = transformedCode.replace(pattern, `{${varName}}`)
  }

  // Step 2: Update function signature to accept destructured props
  // Create destructured params string: { firstName, lastName, ... }
  const destructuredParams = `{ ${variables.join(', ')} }`

  // Match function declarations like:
  // - function EmailTemplate()
  // - function EmailTemplate(  )
  // - const EmailTemplate = () =>
  // - export default function EmailTemplate()

  // Pattern for regular function declarations
  const functionPattern = /(function\s+\w+\s*)\(\s*\)/g
  transformedCode = transformedCode.replace(functionPattern, `$1(${destructuredParams})`)

  // Pattern for arrow function components
  const arrowPattern = /(const\s+\w+\s*=\s*)\(\s*\)\s*=>/g
  transformedCode = transformedCode.replace(arrowPattern, `$1(${destructuredParams}) =>`)

  return { transformedCode, variables }
}
