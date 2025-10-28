import { useState, useEffect, useRef } from 'react'
import type { ImageNode } from '../../../types/email'
import type { BlockComponentProps } from '../types'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function ImageBlock({ block, isEditing, onUpdate, onDelete }: BlockComponentProps) {
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [width, setWidth] = useState(600)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (block.type === 'image') {
      setSrc(block.src || '')
      setAlt(block.alt || '')
      setWidth(block.width || 600)
      setHeight(block.height)
    }
  }, [block])

  if (block.type !== 'image') {
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newSrc = reader.result as string
        setSrc(newSrc)
        onUpdate({ ...block, src: newSrc })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdate = () => {
    const updated: ImageNode = {
      ...block,
      src,
      alt,
      width,
      height: height || undefined,
    }
    onUpdate(updated)
  }

  if (isEditing) {
    return (
      <div className="border-2 border-blue-500 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-sm">Image Block</span>
          </div>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
            aria-label="Delete block"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image Source
            </label>
            {src ? (
              <div className="relative">
                <img
                  src={src}
                  alt={alt || 'Preview'}
                  className="w-full max-w-md rounded border"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
                <button
                  onClick={() => {
                    setSrc('')
                    onUpdate({ ...block, src: '' })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Click to upload image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Describe the image..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                onBlur={handleUpdate}
                min="50"
                max="800"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (px, optional)
              </label>
              <input
                type="number"
                value={height || ''}
                onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
                onBlur={handleUpdate}
                placeholder="Auto"
                min="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-4">
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          width={width}
          height={height}
          className="mx-auto"
        />
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">No image uploaded</p>
          </div>
        </div>
      )}
    </div>
  )
}
