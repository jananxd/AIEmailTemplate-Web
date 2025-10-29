import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Paperclip, Send, X, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface GenerationInputProps {
  onGenerate: (prompt: string, image?: File) => void
  isLoading?: boolean
  defaultPrompt?: string
  onAuthRequired?: () => void
}

export default function GenerationInput({
  onGenerate,
  isLoading,
  defaultPrompt = '',
  onAuthRequired,
}: GenerationInputProps) {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPrompt(defaultPrompt)
  }, [defaultPrompt])

  const handleClick = () => {
    if (!user && onAuthRequired) {
      onAuthRequired()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      onAuthRequired?.()
      return
    }

    if (prompt.trim()) {
      onGenerate(prompt, attachedImage || undefined)
    }
  }

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAttachedImage(file)
    }
  }

  const removeImage = () => {
    setAttachedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative" onClick={handleClick}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            user
              ? 'Describe the email you want to create...'
              : 'Click to login and start creating emails...'
          }
          rows={4}
          className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-pointer"
          disabled={isLoading || !user}
          readOnly={!user}
        />

        {!user && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-lg cursor-pointer">
            <div className="flex items-center gap-2 text-gray-600">
              <Lock size={20} />
              <span className="font-medium">Login required to generate emails</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageAttach}
            className="hidden"
            id="image-upload"
            disabled={!user}
          />
          <label
            htmlFor="image-upload"
            className={`p-2 rounded-lg transition-colors ${
              user
                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={user ? 'Attach image' : 'Login to attach images'}
          >
            <Paperclip size={20} />
          </label>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || !user}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title={user ? 'Generate email' : 'Login to generate emails'}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {attachedImage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Paperclip size={16} className="text-blue-600" />
          <span className="text-sm text-blue-900 flex-1">{attachedImage.name}</span>
          <button
            type="button"
            onClick={removeImage}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </form>
  )
}
