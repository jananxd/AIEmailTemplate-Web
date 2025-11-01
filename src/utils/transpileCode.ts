import { transform } from '@babel/standalone'

export interface TranspileResult {
  success: boolean
  code?: string
  error?: string
}

export function transpileCode(sourceCode: string): TranspileResult {
  try {
    const result = transform(sourceCode, {
      presets: [
        'react',
        'typescript',
        ['env', { modules: 'commonjs' }] // Transform ES modules to CommonJS
      ],
      filename: 'email-template.tsx',
    })

    return {
      success: true,
      code: result.code || '',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transpilation failed',
    }
  }
}
