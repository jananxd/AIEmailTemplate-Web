import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEmail, useUpdateEmail } from '../hooks/useEmails'
import EmailActions from '../components/email/EmailActions'
import CodeTab from '../components/email-editor/CodeTab'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { toast } from 'sonner'
import { wrapWithImports, stripImports } from '../utils/jsxFormat'
import { useGenerationStore } from '../store/generationStore'
import GenerationProgress from '../components/generation/GenerationProgress'
import { generationManager } from '../lib/generationManager'

export default function EmailDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useEmail(id!)
  const updateEmail = useUpdateEmail()

  // Code editor state
  const [codeEditorValue, setCodeEditorValue] = useState<string>('')
  const [isCodeDirty, setIsCodeDirty] = useState(false)

  useUnsavedChanges(isCodeDirty)

  // Update code when email data changes (generate code immediately, not just when on Code tab)
  useEffect(() => {
    if (data && !isCodeDirty) {
      // Use jsx_source from backend (primary source of truth)
      if (data.jsxSource) {
        console.log('EmailDetail: Loading email data, jsxSource length:', data.jsxSource.length)
        const codeWithImports = wrapWithImports(data.jsxSource)
        console.log('EmailDetail: Wrapped with imports, final code length:', codeWithImports.length)
        setCodeEditorValue(codeWithImports)
      } else {
        console.warn('EmailDetail: No jsxSource in email data!')
      }
    }
  }, [data, isCodeDirty])

  // Subscribe to generation state
  const generationState = useGenerationStore((state) =>
    id ? state.generations.get(id) : undefined
  )

  // Check localStorage as fallback for generation state
  const hasGenerationInLocalStorage = id ? !!localStorage.getItem(`generation_${id}`) : false

  const isGenerating = generationState?.status === 'generating' || hasGenerationInLocalStorage

  const handleCancelGeneration = () => {
    if (id) {
      generationManager.cancelGeneration(id)
      navigate('/')
    }
  }

  const handleSaveCode = async (code: string) => {
    try {
      // Strip imports before sending to backend (backend expects bare JSX)
      const bareJsx = stripImports(code)

      // Send JSX to backend - it will parse and validate
      await updateEmail.mutateAsync({
        id: email.id,
        data: {
          jsxSource: bareJsx, // Backend validates and extracts props_schema automatically
        },
      })

      setIsCodeDirty(false)
      setCodeEditorValue(code)
      toast.success('Code saved successfully')
    } catch (error: any) {
      // Backend returns helpful error messages for invalid JSX
      const errorMessage = error.details || error.error || 'Failed to save code'
      toast.error(errorMessage)
      throw error
    }
  }


  // PRIORITY 1: Show generation progress if generating (check both Zustand and localStorage)
  if (isGenerating && !data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <GenerationProgress
          step={generationState?.step || 'starting'}
          message={generationState?.message || 'Starting generation...'}
          status="loading"
          onCancel={handleCancelGeneration}
        />
      </div>
    )
  }

  // PRIORITY 2: Show loading spinner while fetching email
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading email...</p>
        </div>
      </div>
    )
  }

  // PRIORITY 3: Show "Email not found" only if not generating
  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-2">Email not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    )
  }

  const email = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {email.meta.subject}
              </h1>
              <p className="text-sm text-gray-500">
                {email.meta.previewText}
              </p>
            </div>
          </div>
          <EmailActions email={email} testVariables={{}} />
        </div>
      </div>

      {/* Code Editor */}
      <div className="h-[calc(100vh-180px)]">
        <CodeTab
          initialCode={codeEditorValue}
          onSave={handleSaveCode}
        />
      </div>
    </div>
  )
}
