import { useState, useEffect } from 'react'
import type { SpacerNode } from '../../../types/email'
import type { BlockComponentProps } from '../types'
import { MoveVertical, X } from 'lucide-react'

export default function SpacerBlock({ block, isEditing, onUpdate, onDelete }: BlockComponentProps) {
  const [height, setHeight] = useState(20)

  useEffect(() => {
    if (block.type === 'spacer') {
      setHeight(block.height || 20)
    }
  }, [block])

  if (block.type !== 'spacer') {
    return null
  }

  const handleUpdate = () => {
    const updated: SpacerNode = {
      ...block,
      height,
    }
    onUpdate(updated)
  }

  if (isEditing) {
    return (
      <div className="border-2 border-blue-500 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MoveVertical className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-sm">Spacer Block</span>
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
              Height: {height}px
            </label>
            <input
              type="range"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              onMouseUp={handleUpdate}
              onTouchEnd={handleUpdate}
              min="10"
              max="200"
              step="10"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10px</span>
              <span>200px</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="relative">
              <div
                style={{ height: `${height}px` }}
                className="bg-blue-50 border-2 border-dashed border-blue-300 rounded flex items-center justify-center"
              >
                <span className="text-xs text-blue-600 font-medium">{height}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ height: `${height}px` }}
      className="w-full"
      aria-hidden="true"
    />
  )
}
