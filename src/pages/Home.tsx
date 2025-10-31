import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import AuthModal from '../components/auth/AuthModal'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { useGenerationStore } from '../store/generationStore'
import { generationManager } from '../lib/generationManager'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const generateEmail = { isPending: isGenerating }

  const { data: projectsData } = useProjects()
  const projects = projectsData?.projects || []

  const canGenerate = useGenerationStore((state) => state.canStartNewGeneration())
  const inProgressCount = useGenerationStore((state) => state.getInProgressCount())

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    // Check generation limit
    if (!canGenerate) {
      setError('Maximum concurrent generations reached (3). Please wait for one to complete.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Generate UUID for new email
      const emailId = uuidv4()

      // Start background generation
      await generationManager.startGeneration(emailId, {
        prompt,
        projectId: selectedProjectId || undefined,
        attachedImage: imageFile,
        userId: user.id,
      })

      // Navigate immediately (non-blocking)
      navigate(`/email/${emailId}`)
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to start email generation')
      setIsGenerating(false)
    }
  }

  const handleRetry = () => {
    setError(null)
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
        {/* Generation Limit Warning */}
        {inProgressCount >= 3 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">Generation Limit Reached</p>
            <p className="text-yellow-600 text-sm mt-1">
              You have {inProgressCount} generations in progress. Please wait for one to complete before starting a new one.
            </p>
          </div>
        )}

        {/* Project Selector */}
        {projects.length > 0 && !error && (
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
        {!error && (
          <>
            <SamplePrompts onSelectPrompt={setSelectedPrompt} />
            <GenerationInput
              onGenerate={handleGenerate}
              isLoading={!canGenerate || generateEmail.isPending}
              defaultPrompt={selectedPrompt}
              onAuthRequired={() => setIsAuthModalOpen(true)}
            />
          </>
        )}

        {/* Error Display */}
        {error && (
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
