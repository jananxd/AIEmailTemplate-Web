import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEmail, useUpdateEmail } from '../hooks/useEmails'
import EmailActions from '../components/email/EmailActions'
import CodeTab from '../components/email-editor/CodeTab'
import CanvasTab from '../components/email-editor/CanvasTab'
import UnsavedChangesModal from '../components/email-editor/UnsavedChangesModal'
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'canvas' | 'code'>('canvas')
  const [codeEditorValue, setCodeEditorValue] = useState<string>('')
  const [isCodeDirty, setIsCodeDirty] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingTab, setPendingTab] = useState<'canvas' | 'code' | null>(null)

  useUnsavedChanges(isCodeDirty)

  // Update code when email data changes (generate code immediately, not just when on Code tab)
  useEffect(() => {
    if (data && !isCodeDirty) {
      // Use jsx_source from backend (primary source of truth)
      if (data.jsxSource) {
        const codeWithImports = wrapWithImports(data.jsxSource)
        setCodeEditorValue(codeWithImports)
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

  // Tab switching logic
  const handleTabSwitch = (newTab: 'canvas' | 'code') => {
    if (newTab === activeTab) return

    if (activeTab === 'code' && isCodeDirty) {
      setPendingTab(newTab)
      setShowUnsavedModal(true)
      return
    }

    setActiveTab(newTab)
  }

  const handleSaveAndSwitch = async () => {
    try {
      await handleSaveCode(codeEditorValue)
      setIsCodeDirty(false)
      setShowUnsavedModal(false)
      if (pendingTab) {
        setActiveTab(pendingTab)
        setPendingTab(null)
      }
      toast.success('Code saved successfully')
    } catch {
      toast.error('Failed to save code')
    }
  }

  const handleDiscardAndSwitch = () => {
    setIsCodeDirty(false)
    setShowUnsavedModal(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
  }

  const handleCancelSwitch = () => {
    setShowUnsavedModal(false)
    setPendingTab(null)
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

  // TODO: Canvas editor handlers will be removed in Task 4
  const handleReorderBlocks = (_reorderedBlocks: any[]) => {
    // Canvas editor deprecated - will be removed in Task 4
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
  // TODO: Canvas editor will be removed in Task 4
  const blocks: any[] = [] // Placeholder for canvas blocks (deprecated)

  // TODO: Canvas editor handlers will be removed in Task 4
  const handleAddBlock = (_newBlock: any) => {
    // Canvas editor deprecated - will be removed in Task 4
  }

  const handleUpdateBlock = (_blockId: string, _updates: any) => {
    // Canvas editor deprecated - will be removed in Task 4
  }

  const handleDeleteBlock = (_blockId: string) => {
    // Canvas editor deprecated - will be removed in Task 4
  }

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => handleTabSwitch('canvas')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'canvas'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Canvas
            </button>
            <button
              onClick={() => handleTabSwitch('code')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors relative ${
                activeTab === 'code'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Code
              {isCodeDirty && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="h-[calc(100vh-180px)]">
        {activeTab === 'canvas' ? (
          <CanvasTab
            blocks={blocks}
            onAddBlock={handleAddBlock}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onReorderBlocks={handleReorderBlocks}
          />
        ) : (
          <CodeTab
            initialCode={codeEditorValue}
            onSave={handleSaveCode}
          />
        )}
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAndSwitch={handleSaveAndSwitch}
        onDiscard={handleDiscardAndSwitch}
        onCancel={handleCancelSwitch}
      />
    </div>
  )
}
