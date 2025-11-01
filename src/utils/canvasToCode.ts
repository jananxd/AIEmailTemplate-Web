import type { EmailNode } from '../types/email'

/**
 * Transform {{variableName}} patterns in a string to JSX expressions {variableName}
 * Returns either a simple string or JSX with expressions
 *
 * Examples:
 * - "Hello World" -> "Hello World"
 * - "Hello {{firstName}}" -> "Hello {firstName}"
 * - "{{greeting}} {{name}}" -> "{greeting} {name}"
 */
function transformVariablesInString(text: string): string {
  // Check if text contains {{variable}} patterns
  const hasVariables = /\{\{(\w+)\}\}/g.test(text)

  if (!hasVariables) {
    return text
  }

  // Transform {{variableName}} to {variableName}
  // This creates a JSX expression that React will evaluate
  return text.replace(/\{\{(\w+)\}\}/g, '{$1}')
}

/**
 * Extract all variable names from blocks recursively
 */
function extractVariablesFromBlocks(blocks: EmailNode[]): Set<string> {
  const variables = new Set<string>()
  const variablePattern = /\{\{(\w+)\}\}/g

  function extractFromText(text: string) {
    let match
    while ((match = variablePattern.exec(text)) !== null) {
      variables.add(match[1])
    }
    variablePattern.lastIndex = 0 // Reset regex
  }

  function extractFromBlock(block: EmailNode) {
    // Extract from text content (heading and text nodes)
    if (block.type === 'heading' || block.type === 'text') {
      if (block.text) {
        extractFromText(block.text)
      }
    }

    // Extract from button label and href
    if (block.type === 'button') {
      if (block.label) {
        extractFromText(block.label)
      }
      if (block.href) {
        extractFromText(block.href)
      }
    }

    // Extract from image src and alt
    if (block.type === 'image') {
      if (block.src) {
        extractFromText(block.src)
      }
      if (block.alt) {
        extractFromText(block.alt)
      }
    }

    // Recurse into children
    if (block.children) {
      block.children.forEach(extractFromBlock)
    }
  }

  blocks.forEach(extractFromBlock)
  return variables
}

/**
 * Convert a string to PascalCase for component names
 * Example: "welcome email" -> "WelcomeEmail"
 */
function toPascalCase(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter
    .join('')
}

/**
 * Convert Canvas blocks to React Email JSX (full React component with imports)
 * @param blocks - The email blocks to convert
 * @param subject - Optional email subject to use as component name (will be converted to PascalCase)
 */
export function canvasToCode(blocks: EmailNode[], subject?: string): string {
  // Extract all variables from blocks
  const variables = extractVariablesFromBlocks(blocks)
  const hasVariables = variables.size > 0

  // Generate component name from subject or use default
  const componentName = subject ? toPascalCase(subject) : 'EmailTemplate'
  const propsInterfaceName = `${componentName}Props`

  const blockToJSX = (block: EmailNode, indent = 6): string => {
    const spaces = ' '.repeat(indent)

    switch (block.type) {
      case 'heading': {
        const level = block.level || 1
        const headingClass = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'
        const text = block.text || ''
        const transformedText = transformVariablesInString(text)
        return `${spaces}<Heading as="h${level}" className="${headingClass} font-bold mb-4">${transformedText}</Heading>`
      }

      case 'text': {
        const text = block.text || ''
        const transformedText = transformVariablesInString(text)
        return `${spaces}<Text className="mb-4">${transformedText}</Text>`
      }

      case 'button': {
        const label = block.label || 'Click me'
        const href = block.href || '#'
        const transformedLabel = transformVariablesInString(label)
        const transformedHref = transformVariablesInString(href)
        return `${spaces}<Button href="${transformedHref}" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">${transformedLabel}</Button>`
      }

      case 'image': {
        const src = block.src || ''
        const alt = block.alt || ''
        const transformedSrc = transformVariablesInString(src)
        const transformedAlt = transformVariablesInString(alt)
        return `${spaces}<Img src="${transformedSrc}" alt="${transformedAlt}" width={${block.width || 600}} height={${block.height || 400}} className="max-w-full h-auto mb-4" />`
      }

      case 'divider':
        return `${spaces}<Hr className="my-4" style={{ borderColor: '${block.color || '#E5E7EB'}', width: '${block.width || 100}%' }} />`

      case 'spacer':
        return `${spaces}<Section style={{ height: '${block.height || 20}px' }} />`

      case 'section': {
        const children = block.children?.map(child => blockToJSX(child, indent + 2)).join('\n') || ''
        const bgColor = block.backgroundColor || '#FFFFFF'
        const padding = block.padding || '20px'
        return `${spaces}<Section className="mb-4" style={{ backgroundColor: '${bgColor}', padding: '${padding}' }}>
${children}
${spaces}</Section>`
      }

      default:
        return ''
    }
  }

  const blocksJSX = blocks.map(block => blockToJSX(block, 6)).join('\n\n')

  // Generate interface and PreviewProps if variables exist
  const variableArray = Array.from(variables)

  let interfaceDeclaration = ''
  let previewPropsDeclaration = ''
  let functionSignature = `export const ${componentName} = ()`

  if (hasVariables) {
    // Generate interface
    const interfaceProps = variableArray
      .map(varName => `  ${varName}?: string;`)
      .join('\n')

    interfaceDeclaration = `interface ${propsInterfaceName} {
${interfaceProps}
}

`

    // Generate PreviewProps with example values (supporting template literals)
    const propsEntries = variableArray.map(varName => {
      const exampleValue = generateExampleValue(varName)
      return `  ${varName}: ${exampleValue},`
    }).join('\n')

    previewPropsDeclaration = `
${componentName}.PreviewProps = {
${propsEntries}
} as ${propsInterfaceName};
`

    // Update function signature to destructure props
    functionSignature = `export const ${componentName} = ({\n  ${variableArray.join(',\n  ')},\n}: ${propsInterfaceName})`
  } else {
    functionSignature = `export const ${componentName} = ()`
  }

  // Check if any example values use template literals (baseUrl)
  const usesBaseUrl = hasVariables && variableArray.some(varName => {
    const exampleValue = generateExampleValue(varName)
    return exampleValue.includes('baseUrl')
  })

  // Add baseUrl declaration if needed
  const baseUrlDeclaration = usesBaseUrl
    ? `\nconst baseUrl = process.env.VERCEL_URL\n  ? \`https://\${process.env.VERCEL_URL}\`\n  : '';\n`
    : ''

  // Generate full React component with imports (for editor display)
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
  Tailwind,
} from '@react-email/components';
${baseUrlDeclaration}
${interfaceDeclaration}${functionSignature} => {
  return (
    <Tailwind>
      <Html>
        <Head>
          <title>Email Template</title>
        </Head>
        <Preview>Email preview text</Preview>
        <Body style={{ backgroundColor: '#f6f9fc', margin: '0' }}>
          <Container style={{ width: '600px', maxWidth: '100%', margin: '0 auto', background: '#fff', padding: '20px' }}>
${blocksJSX}
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
${previewPropsDeclaration}
export default ${componentName};`
}

/**
 * Generate example value for a variable name
 * Returns either a quoted string or a template literal (without quotes) for code generation
 */
function generateExampleValue(propName: string): string {
  // Map of variable names to example values
  // Values can be:
  // - Plain strings (will be wrapped in quotes)
  // - Objects with { value, isLiteral } where isLiteral=true means it's a template literal
  const EXAMPLE_VALUES: Record<string, string | { value: string; isLiteral: boolean }> = {
    // Names
    firstName: 'John',
    firstname: 'John',
    lastName: 'Doe',
    lastname: 'Doe',
    fullName: 'John Doe',
    fullname: 'John Doe',
    name: 'John Doe',
    username: 'johndoe',

    // Contact
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',

    // Location
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    zipCode: '94102',
    zipcode: '94102',

    // Company
    company: 'Acme Corp',
    companyName: 'Acme Corp',
    companyname: 'Acme Corp',
    teamName: 'Engineering Team',
    teamname: 'Engineering Team',

    // Product/Order
    productName: 'Premium Plan',
    productname: 'Premium Plan',
    orderNumber: '#12345',
    ordernumber: '#12345',

    // Common actions
    verificationCode: '123456',
    verificationcode: '123456',
    resetLink: 'https://example.com/reset-password',
    resetlink: 'https://example.com/reset-password',
    confirmationLink: 'https://example.com/confirm',
    confirmationlink: 'https://example.com/confirm',
    inviteLink: 'https://example.com/invite',
    invitelink: 'https://example.com/invite',

    // Images (use template literals with baseUrl)
    userImage: { value: '`${baseUrl}/static/user-avatar.png`', isLiteral: true },
    userimage: { value: '`${baseUrl}/static/user-avatar.png`', isLiteral: true },
    teamImage: { value: '`${baseUrl}/static/team-logo.png`', isLiteral: true },
    teamimage: { value: '`${baseUrl}/static/team-logo.png`', isLiteral: true },
    logo: { value: '`${baseUrl}/static/logo.png`', isLiteral: true },
    logoUrl: { value: '`${baseUrl}/static/logo.png`', isLiteral: true },
    logourl: { value: '`${baseUrl}/static/logo.png`', isLiteral: true },

    // IP/Location
    inviteFromIp: '192.168.1.1',
    invitefromip: '192.168.1.1',
    inviteFromLocation: 'San Francisco, CA',
    invitefromlocation: 'San Francisco, CA',

    // Dates
    date: 'January 15, 2024',
    expiryDate: 'January 31, 2024',
    expirydate: 'January 31, 2024',

    // Generic
    greeting: 'Hello',
    message: 'This is a sample message',
    title: 'Welcome',
    subject: 'Important Update',
  }

  const lowerPropName = propName.toLowerCase()

  // Check if we have a predefined example
  if (lowerPropName in EXAMPLE_VALUES) {
    const exampleValue = EXAMPLE_VALUES[lowerPropName]
    if (typeof exampleValue === 'object' && exampleValue.isLiteral) {
      return exampleValue.value // Return template literal as-is (no quotes)
    }
    return `'${exampleValue}'` // Wrap string in quotes
  }

  // Try to infer from common patterns
  // For images, use template literals
  if (propName.toLowerCase().includes('image') ||
      propName.toLowerCase().includes('avatar') ||
      propName.toLowerCase().includes('photo') ||
      propName.toLowerCase().includes('picture')) {
    return '`${baseUrl}/static/placeholder.png`'
  }

  // For other URLs/links, use plain strings
  if (propName.toLowerCase().includes('url') || propName.toLowerCase().includes('link')) {
    return "'https://example.com'"
  }

  // Standard string patterns
  if (propName.toLowerCase().includes('name')) {
    return "'Sample Name'"
  }
  if (propName.toLowerCase().includes('email')) {
    return "'sample@example.com'"
  }
  if (propName.toLowerCase().includes('code')) {
    return "'123456'"
  }
  if (propName.toLowerCase().includes('date')) {
    return "'January 1, 2024'"
  }
  if (propName.toLowerCase().includes('number')) {
    return "'12345'"
  }

  // Default: use a readable placeholder
  return `'Sample ${propName}'`
}
