/**
 * Extract prop names from TypeScript interface in code
 * Looks for patterns like: interface FooProps { username?: string; email?: string; }
 */
export function extractPropsFromCode(code: string): string[] {
  const propNames: string[] = []

  // Find interface declarations (matches both single-line and multi-line)
  // Use [\s\S] instead of [^}] to match newlines
  const interfaceRegex = /interface\s+\w+Props\s*\{([\s\S]+?)\}/g
  const matches = code.matchAll(interfaceRegex)

  for (const match of matches) {
    const interfaceBody = match[1]

    // Extract property names from interface body
    // Matches: propertyName?: type or propertyName: type
    const propRegex = /(\w+)\??:\s*[^;,\n]+/g
    const propMatches = interfaceBody.matchAll(propRegex)

    for (const propMatch of propMatches) {
      const propName = propMatch[1]
      if (propName && !propNames.includes(propName)) {
        propNames.push(propName)
      }
    }
  }

  return propNames
}

/**
 * Common example values for variable names
 */
const EXAMPLE_VALUES: Record<string, string> = {
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

/**
 * Generate example value for a variable name
 */
function generateExampleValue(propName: string): string {
  // Check if we have a predefined example
  const lowerPropName = propName.toLowerCase()
  if (lowerPropName in EXAMPLE_VALUES) {
    return EXAMPLE_VALUES[lowerPropName]
  }

  // Try to infer from common patterns
  if (propName.toLowerCase().includes('name')) {
    return 'Sample Name'
  }
  if (propName.toLowerCase().includes('email')) {
    return 'sample@example.com'
  }
  if (propName.toLowerCase().includes('url') || propName.toLowerCase().includes('link')) {
    return 'https://example.com'
  }
  if (propName.toLowerCase().includes('code')) {
    return '123456'
  }
  if (propName.toLowerCase().includes('date')) {
    return 'January 1, 2024'
  }
  if (propName.toLowerCase().includes('number')) {
    return '12345'
  }

  // Default: use a readable placeholder
  return `Sample ${propName}`
}

/**
 * Create props object with example values for preview
 */
export function createMockProps(propNames: string[]): Record<string, string> {
  const props: Record<string, string> = {}

  for (const propName of propNames) {
    props[propName] = generateExampleValue(propName)
  }

  return props
}
