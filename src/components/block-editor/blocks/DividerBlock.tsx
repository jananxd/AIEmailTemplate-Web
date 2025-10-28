import { useState, useEffect } from 'react'
import type { DividerNode } from '../../../types/email'
import type { BlockComponentProps } from '../types'
import { Minus, X } from 'lucide-react'

export default function DividerBlock({ block, isEditing, onUpdate, onDelete }: BlockComponentProps) {
  const [color, setColor] = useState('#E5E7EB')
  const [thickness, setThickness] = useState(1)
  const [width, setWidth] = useState(100)

  useEffect(() => {
    if (block.type === 'divider') {
      setColor(block.color || '#E5E7EB')
      setThickness(block.thickness || 1)
      setWidth(block.width || 100)
    }
  }, [block])

  if (block.type !== 'divider') {
    return null
  }

  const handleUpdate = () => {
    const updated: DividerNode = {
      ...block,
      color,
      thickness,
      width,
    }
    onUpdate(updated)
  }

  if (isEditing) {
    return (
      <div className="border-2 border-blue-500 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Minus className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-sm">Divider Block</span>
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
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={handleUpdate}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={handleUpdate}
                placeholder="#E5E7EB"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thickness: {thickness}px
            </label>
            <input
              type="range"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              onMouseUp={handleUpdate}
              onTouchEnd={handleUpdate}
              min="1"
              max="10"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width: {width}%
            </label>
            <input
              type="range"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              onMouseUp={handleUpdate}
              onTouchEnd={handleUpdate}
              min="10"
              max="100"
              className="w-full"
            />
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <hr
              style={{
                borderColor: color,
                borderWidth: `${thickness}px`,
                width: `${width}%`,
                margin: '0 auto',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-4">
      <hr
        style={{
          borderColor: color,
          borderWidth: `${thickness}px`,
          width: `${width}%`,
          margin: '0 auto',
        }}
      />
    </div>
  )
}
