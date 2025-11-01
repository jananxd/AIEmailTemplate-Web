import { ErrorBoundary } from 'react-error-boundary'
import { useLivePreview } from '../../hooks/useLivePreview'
import * as React from 'react'
import * as ReactEmailComponents from '@react-email/components'
import { render } from '@react-email/render'

interface LivePreviewProps {
  code: string
}

/**
 * Execute transpiled code and return the component
 */
function executeCode(transpiledCode: string): React.ComponentType | null {
  try {
    // Create module system for CommonJS
    const module = { exports: {} as any }
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

    // Execute the transpiled CommonJS code
    const func = new Function('require', 'module', 'exports', 'React', transpiledCode)
    func(require, module, exports, React)

    // Return the default export
    return module.exports.default || module.exports || null
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

export default function LivePreview({ code }: LivePreviewProps) {
  const { transpiledCode, error, isTranspiling } = useLivePreview({ code })
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
          setRenderError('Failed to execute the transpiled code')
          return
        }

        // Render the component to HTML string (render returns a Promise)
        const htmlString = await render(React.createElement(EmailComponent))
        setHtml(htmlString)
        setRenderError(null)
      } catch (err) {
        console.error('Failed to render email component:', err)
        setRenderError(err instanceof Error ? err.message : 'Failed to render component')
      }
    }

    renderComponent()
  }, [transpiledCode])

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
      <div className="h-full overflow-auto bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-sm text-gray-500 mb-4 px-4">
            Live Preview
          </div>
          {/* Render the email HTML in an iframe */}
          <iframe
            srcDoc={html}
            title="Email Preview"
            className="w-full bg-white rounded-lg shadow-sm border border-gray-200"
            style={{ minHeight: '600px', height: '100%' }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}
