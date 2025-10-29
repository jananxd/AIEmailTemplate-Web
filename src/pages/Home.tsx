import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import GenerationProgress from '../components/generation/GenerationProgress'
import AuthModal from '../components/auth/AuthModal'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const generateEmail = { isPending: isGenerating }

  const { data: projectsData } = useProjects()
  const projects = projectsData?.projects || []

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgressStep('validating')
    setProgressMessage('Starting generation...')

    try {
      const controller = await api.generateEmailStream(
        {
          prompt,
          projectId: selectedProjectId || undefined,
          attachedImage: imageFile,
          userId: user.id,
        },
        {
          onProgress: (step, message) => {
            setProgressStep(step)
            setProgressMessage(message)
          },
          onSuccess: (email) => {
            // Success! Navigate to email detail page
            navigate(`/email/${email.id}`)
          },
          onError: (error, details) => {
            console.error('Generation failed:', error, details)
            setError(details || error)
            setProgressStep('error')
            setProgressMessage('Generation failed. Please try again.')
            setIsGenerating(false)
          },
        }
      )

      setAbortController(controller)
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate email')
      setProgressStep('error')
      setProgressMessage('Generation failed. Please try again.')
      setIsGenerating(false)
    }
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsGenerating(false)
    setProgressStep('')
    setProgressMessage('')
    setError(null)
  }

  const handleRetry = () => {
    setError(null)
    setProgressStep('')
    setProgressMessage('')
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Create beautiful emails with AI
        </h1>
        <p className="text-lg text-gray-600">
          Describe what you need, and let AI generate professional email templates instantly
        </p>
      </div>

      <div className="space-y-8">
        {/* Project Selector */}
        {projects.length > 0 && !isGenerating && !error && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (optional)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No project (standalone email)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Generation Input */}
        {!isGenerating && !error && (
          <>
            <SamplePrompts onSelectPrompt={setSelectedPrompt} />
            <GenerationInput
              onGenerate={handleGenerate}
              isLoading={generateEmail.isPending}
              defaultPrompt={selectedPrompt}
              onAuthRequired={() => setIsAuthModalOpen(true)}
            />
          </>
        )}

        {/* Progress Indicator */}
        {isGenerating && (
          <GenerationProgress
            step={progressStep}
            message={progressMessage}
            status="loading"
            onCancel={handleCancel}
          />
        )}

        {/* Error Display */}
        {error && !isGenerating && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Generation Failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
