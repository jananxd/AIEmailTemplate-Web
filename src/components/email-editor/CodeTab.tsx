import { useCallback, useState, useEffect } from 'react'
import CodeEditor from './CodeEditor'
import LivePreview from './LivePreview'
import { useCodeEditor } from '../../hooks/useCodeEditor'
import { validateCode } from '../../utils/validateCode'

interface CodeTabProps {
  initialCode: string
  onSave: (code: string) => Promise<void>
}

export default function CodeTab({ initialCode, onSave }: CodeTabProps) {
  const {
    code,
    isDirty,
    handleEditorChange,
    handleEditorDidMount,
    resetDirty,
  } = useCodeEditor({
    initialValue: initialCode,
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isEditorLoaded, setIsEditorLoaded] = useState(false)

  const handleEditorMount = useCallback((editor: Parameters<typeof handleEditorDidMount>[0]) => {
    handleEditorDidMount(editor)
    setIsEditorLoaded(true)
  }, [handleEditorDidMount])

  const handleSave = useCallback(async () => {
    const validation = validateCode(code)

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])
    await onSave(code)
    resetDirty()
  }, [code, onSave, resetDirty])

  // Listen for Cmd/Ctrl+S event
  useEffect(() => {
    const handleSaveEvent = () => {
      handleSave()
    }

    window.addEventListener('editor-save', handleSaveEvent)
    return () => window.removeEventListener('editor-save', handleSaveEvent)
  }, [handleSave])

  return (
    <div className="h-full flex flex-col">
      {/* Header with save button */}
      <div className="bg-gray-800 text-white px-4 py-3 flex flex-col border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Email Template Code</h3>
            {isDirty && (
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || validationErrors.length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save (Cmd/Ctrl+S)
          </button>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-600 text-white px-3 py-2 rounded text-sm">
            <strong>Cannot save:</strong>
            <ul className="mt-1 ml-4 list-disc">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Split view: Editor | Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 border-r border-gray-300 relative">
          {!isEditorLoaded && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white text-lg">Loading Monaco Editor...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a moment on first load</p>
              </div>
            </div>
          )}
          <CodeEditor
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
          />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2">
          <LivePreview code={code} />
        </div>
      </div>
    </div>
  )
}
