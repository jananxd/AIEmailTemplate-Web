import { ErrorBoundary } from 'react-error-boundary'
import { useLivePreview } from '../../hooks/useLivePreview'
import * as React from 'react'
import * as ReactEmailComponents from '@react-email/components'
import { render } from '@react-email/render'
import { extractPropsFromCode, createMockProps } from '../../utils/extractPropsFromCode'
import { transformVariablesToProps } from '../../utils/transformVariablesToProps'

interface EmailIframeRendererProps {
  // JSX code to render
  code: string
}

/**
 * Execute transpiled code and return the component
 */
function executeCode(transpiledCode: string): React.ComponentType | null {
  try {
    // Create module system for CommonJS
    const module = { exports: {} as Record<string, unknown> }
    const exports = module.exports

    // Create require function that maps to our available modules
    const require = (moduleName: string) => {
      if (moduleName === 'react' || moduleName.startsWith('react/')) {
        return React
      }
      if (moduleName === '@react-email/components') {
        return ReactEmailComponents
      }
      throw new Error(`Module not found: ${moduleName}`)
    }

    // Create mock process.env for code that references environment variables
    const process = {
      env: {
        VERCEL_URL: '',
        NODE_ENV: 'development',
      }
    }

    // Execute the transpiled CommonJS code
    const func = new Function('require', 'module', 'exports', 'React', 'process', transpiledCode)
    func(require, module, exports, React, process)

    // Return the default export (must be a function/component)
    const defaultExport = module.exports.default || module.exports
    if (typeof defaultExport === 'function') {
      return defaultExport as React.ComponentType
    }
    return null
  } catch (error) {
    console.error('Failed to execute transpiled code:', error)
    return null
  }
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-full bg-red-50">
      <div className="max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-2">Preview Error</h2>
        <p className="text-red-700 mb-4">Failed to render preview:</p>
        <pre className="bg-red-100 p-4 rounded text-sm text-red-900 overflow-auto">
          {error.message}
        </pre>
      </div>
    </div>
  )
}

export default function EmailIframeRenderer({ code }: EmailIframeRendererProps) {
  console.log('EmailIframeRenderer mounted, code length:', code?.length)

  // Transform code and extract variables
  const { codeToTranspile, detectedVariables } = React.useMemo(() => {
    // Transform {{varName}} to {varName}
    const { transformedCode, variables: vars } = transformVariablesToProps(code)
    console.log('Transformed code, detected variables:', vars)
    return { codeToTranspile: transformedCode, detectedVariables: vars }
  }, [code])

  const { transpiledCode, error, isTranspiling } = useLivePreview({ code: codeToTranspile })
  const [html, setHtml] = React.useState<string>('')
  const [renderError, setRenderError] = React.useState<string | null>(null)


  // Render the component to HTML when transpiled code changes
  React.useEffect(() => {
    if (!transpiledCode) {
      setHtml('')
      setRenderError(null)
      return
    }

    async function renderComponent() {
      try {
        // Execute the transpiled code to get the component
        const EmailComponent = executeCode(transpiledCode)

        if (!EmailComponent) {
          console.error('Failed to execute transpiled code - no component returned')
          setRenderError('Failed to execute the transpiled code')
          return
        }

        console.log('EmailComponent successfully created:', typeof EmailComponent)

        // Create props with variable values
        let props = {}
        // First, check for {{varName}} variables that were transformed
        if (detectedVariables.length > 0) {
          // Create mock props with {{variableName}} format for preview
          props = createMockProps(detectedVariables)
          console.log('Using detected variables:', detectedVariables, props)
        } else {
          // Fallback: check for TypeScript interface props
          const propNames = extractPropsFromCode(codeToTranspile)
          console.log('Extracted props from TypeScript interface:', propNames)
          props = createMockProps(propNames)
          console.log('Created mock props:', props)
        }

        // Check if component has PreviewProps static property (highest priority)
        const componentWithProps = EmailComponent as unknown as { PreviewProps?: Record<string, unknown> }
        if (componentWithProps.PreviewProps) {
          props = componentWithProps.PreviewProps
          console.log('Using PreviewProps:', props)
        }

        // Create the component element
        const componentElement = React.createElement(EmailComponent, props)

        // Check if the code has proper email structure
        const hasHtmlWrapper = codeToTranspile.includes('<Html')
        const hasTailwindWrapper = codeToTranspile.includes('<Tailwind')

        let componentToRender = componentElement

        // If code doesn't have Html wrapper (user-written code might not),
        // wrap it with proper email structure
        if (!hasHtmlWrapper) {
          // Create the HTML structure
          const htmlStructure = React.createElement(
            ReactEmailComponents.Html,
            { children: [
              React.createElement(ReactEmailComponents.Head, { key: 'head' }),
              React.createElement(
                ReactEmailComponents.Body,
                {
                  key: 'body',
                  style: { backgroundColor: '#f6f9fc', margin: '0' },
                  children: React.createElement(
                    ReactEmailComponents.Container,
                    {
                      style: { width: '600px', maxWidth: '100%', margin: '0 auto', background: '#fff', padding: '20px' },
                      children: componentElement
                    }
                  )
                }
              )
            ]}
          )

          // Wrap with Tailwind on the OUTSIDE (Tailwind wraps Html, not inside it)
          componentToRender = hasTailwindWrapper
            ? htmlStructure
            : React.createElement(ReactEmailComponents.Tailwind, { children: htmlStructure })
        }

        // Render the component to HTML string (render returns a Promise)
        const htmlString = await render(componentToRender)
        console.log('Successfully rendered HTML, length:', htmlString.length)
        setHtml(htmlString)
        setRenderError(null)
      } catch (err) {
        console.error('Failed to render email component:', err)
        setRenderError(err instanceof Error ? err.message : 'Failed to render component')
      }
    }

    renderComponent()
  }, [transpiledCode, codeToTranspile, detectedVariables])

  if (isTranspiling) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Transpiling...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="max-w-2xl p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Transpilation Error</h2>
          <p className="text-red-700 mb-4">Fix errors before saving:</p>
          <pre className="bg-red-100 p-4 rounded text-sm text-red-900 overflow-auto max-h-64">
            {error}
          </pre>
        </div>
      </div>
    )
  }

  if (renderError) {
    return (
      <div className="flex items-center justify-center h-full bg-yellow-50">
        <div className="max-w-2xl p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Render Error</h2>
          <p className="text-yellow-700 mb-4">Failed to render the email component:</p>
          <pre className="bg-yellow-100 p-4 rounded text-sm text-yellow-900 overflow-auto">
            {renderError}
          </pre>
        </div>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Start typing to see preview...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <iframe
        srcDoc={html}
        title="Email Preview"
        className="w-full bg-white rounded-lg shadow-sm border border-gray-200"
        style={{ minHeight: '600px', height: '100%' }}
        sandbox="allow-same-origin allow-scripts"
      />
    </ErrorBoundary>
  )
}
