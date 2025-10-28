import { useState } from 'react'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'

export default function Home() {
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (prompt: string, image?: File) => {
    setIsGenerating(true)

    // TODO: Call API to generate email
    console.log('Generating email with prompt:', prompt, 'Image:', image)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsGenerating(false)

    // TODO: Navigate to email detail page
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
        <SamplePrompts onSelectPrompt={setSelectedPrompt} />

        <GenerationInput
          onGenerate={handleGenerate}
          isLoading={isGenerating}
          defaultPrompt={selectedPrompt}
        />

        {isGenerating && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Generating your email template...</p>
          </div>
        )}
      </div>
    </div>
  )
}
