import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import type { BrandContext } from '../../types/project'
import { api } from '../../lib/api'

interface BrandContextFormProps {
  initialContext?: BrandContext
  onSubmit: (context: BrandContext) => void
  onCancel: () => void
}

export default function BrandContextForm({
  initialContext,
  onSubmit,
  onCancel,
}: BrandContextFormProps) {
  const [name, setName] = useState(initialContext?.name || '')
  const [description, setDescription] = useState(initialContext?.description || '')
  const [logo, setLogo] = useState(initialContext?.logo || '')
  const [voiceGuidelines, setVoiceGuidelines] = useState(
    initialContext?.voiceGuidelines || ''
  )
  const [primaryColor, setPrimaryColor] = useState(
    initialContext?.colors.primary || '#3B82F6'
  )
  const [secondaryColor, setSecondaryColor] = useState(
    initialContext?.colors.secondary || '#10B981'
  )
  const [accentColor, setAccentColor] = useState(
    initialContext?.colors.accent || '#F59E0B'
  )
  const [isUploading, setIsUploading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setIsUploading(true)
    try {
      const { url } = await api.uploadImage(file)
      setLogo(url)
    } catch (error) {
      console.error('Logo upload failed:', error)
      alert('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Brand name is required')
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      logo,
      voiceGuidelines: voiceGuidelines.trim(),
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brand Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your brand..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo
        </label>
        {logo ? (
          <div className="relative inline-block">
            <img src={logo} alt="Brand logo" className="h-20 w-auto rounded-lg" />
            <button
              type="button"
              onClick={() => setLogo('')}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">
              {isUploading ? 'Uploading...' : 'Click to upload logo'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Voice Guidelines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Voice & Tone Guidelines
        </label>
        <textarea
          value={voiceGuidelines}
          onChange={(e) => setVoiceGuidelines(e.target.value)}
          placeholder="e.g., Friendly, professional, casual. Use active voice and inclusive language."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Brand Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand Colors
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Primary</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Secondary</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Accent</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialContext ? 'Update' : 'Create'} Project
        </button>
      </div>
    </form>
  )
}
