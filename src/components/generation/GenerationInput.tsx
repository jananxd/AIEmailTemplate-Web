import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Paperclip, Send, X } from 'lucide-react'

interface GenerationInputProps {
  onGenerate: (prompt: string, image?: File) => void
  isLoading?: boolean
  defaultPrompt?: string
}

export default function GenerationInput({
  onGenerate,
  isLoading,
  defaultPrompt = ''
}: GenerationInputProps) {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPrompt(defaultPrompt)
  }, [defaultPrompt])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
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
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the email you want to create..."
          rows={4}
          className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageAttach}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            title="Attach image"
          >
            <Paperclip size={20} />
          </label>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Generate email"
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
