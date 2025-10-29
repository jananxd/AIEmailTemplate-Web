import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import AuthModal from '../components/auth/AuthModal'
import { useGenerateEmail } from '../hooks/useEmails'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const generateEmail = useGenerateEmail()
  const { data: projectsData } = useProjects()

  const projects = projectsData?.projects || []

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      let attachedImage: string | undefined

      // Upload image if provided
      if (imageFile) {
        const { url } = await api.uploadImage(imageFile)
        attachedImage = url
      }

      // Generate email
      generateEmail.mutate(
        {
          prompt,
          projectId: selectedProjectId || undefined,
          attachedImage,
          userId: user.id,
        },
        {
          onSuccess: (response) => {
            // Navigate to email detail page
            navigate(`/email/${response.email.id}`)
          },
        }
      )
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate email. Please try again.')
    }
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
        {projects.length > 0 && (
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

        <SamplePrompts onSelectPrompt={setSelectedPrompt} />

        <GenerationInput
          onGenerate={handleGenerate}
          isLoading={generateEmail.isPending}
          defaultPrompt={selectedPrompt}
          onAuthRequired={() => setIsAuthModalOpen(true)}
        />

        {generateEmail.isPending && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Generating your email template...</p>
          </div>
        )}

        {generateEmail.isError && (
          <div className="text-center py-4 text-red-600">
            <p>Failed to generate email. Please try again.</p>
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
