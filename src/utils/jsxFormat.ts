/**
 * Utility functions for converting between display format (with imports)
 * and backend format (bare JSX)
 */

/**
 * Check if code has import statements
 */
export function hasImports(code: string): boolean {
  return code.trim().startsWith('import')
}

/**
 * Wrap bare JSX with imports for display in Monaco editor
 */
export function wrapWithImports(bareJsx: string): string {
  // If already has imports, return as-is
  if (hasImports(bareJsx)) {
    return bareJsx
  }

  // Wrap with imports and function
  return `import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Img,
  Hr,
  Preview,
  Link,
  Row,
  Column,
  Tailwind,
} from '@react-email/components';

function EmailTemplate() {
  return (
${bareJsx.split('\n').map(line => '    ' + line).join('\n')}
  );
}

export default EmailTemplate;`
}

/**
 * Strip imports from full code to get bare JSX for backend
 */
export function stripImports(fullCode: string): string {
  // If no imports, return as-is
  if (!hasImports(fullCode)) {
    return fullCode
  }

  try {
    // Find the start of the return statement
    const returnMatch = fullCode.match(/return\s*\(/m)
    if (!returnMatch || returnMatch.index === undefined) {
      // No return statement found, return as-is
      return fullCode
    }

    // Extract everything after "return ("
    const afterReturn = fullCode.substring(returnMatch.index + returnMatch[0].length)

    // Find the matching closing parenthesis
    // Simple approach: find last occurrence of ");" before "}" or "export"
    const lines = afterReturn.split('\n')
    const jsxLines: string[] = []
    let foundEnd = false

    for (const line of lines) {
      // Stop when we hit the closing of the return statement
      if (line.trim().startsWith(');') || line.trim() === ')' || line.trim().startsWith('export')) {
        foundEnd = true
        break
      }
      jsxLines.push(line)
    }

    if (!foundEnd || jsxLines.length === 0) {
      // Couldn't parse, return original
      return fullCode
    }

    // Remove the first indentation level (4 spaces)
    const bareJsx = jsxLines
      .map(line => line.startsWith('    ') ? line.substring(4) : line)
      .join('\n')
      .trim()

    return bareJsx
  } catch (error) {
    console.error('Failed to strip imports:', error)
    // If parsing fails, return original code
    return fullCode
  }
}
