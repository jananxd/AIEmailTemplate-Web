import { useState, useEffect } from 'react'
import type { SectionNode } from '../../../types/email'
import type { BlockComponentProps } from '../types'
import { Box, X } from 'lucide-react'

interface SectionBlockProps extends BlockComponentProps {
  children?: React.ReactNode
}

export default function SectionBlock({ block, isEditing, onUpdate, onDelete, children }: SectionBlockProps) {
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [padding, setPadding] = useState('20px')
  const [borderRadius, setBorderRadius] = useState('0px')

  useEffect(() => {
    if (block.type === 'section') {
      setBackgroundColor(block.backgroundColor || '#FFFFFF')
      setPadding(block.padding || '20px')
      setBorderRadius(block.borderRadius || '0px')
    }
  }, [block])

  if (block.type !== 'section') {
    return null
  }

  const handleUpdate = () => {
    const updated: SectionNode = {
      ...block,
      backgroundColor,
      padding,
      borderRadius,
    }
    onUpdate(updated)
  }

  const paddingValue = parseInt(padding) || 20
  const borderRadiusValue = parseInt(borderRadius) || 0

  if (isEditing) {
    return (
      <div className="border-2 border-blue-500 rounded-lg p-4 bg-white mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-sm">Section Block</span>
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
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                onBlur={handleUpdate}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                onBlur={handleUpdate}
                placeholder="#FFFFFF"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Padding: {paddingValue}px
            </label>
            <input
              type="range"
              value={paddingValue}
              onChange={(e) => setPadding(`${e.target.value}px`)}
              onMouseUp={handleUpdate}
              onTouchEnd={handleUpdate}
              min="0"
              max="80"
              step="4"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0px</span>
              <span>80px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Border Radius: {borderRadiusValue}px
            </label>
            <input
              type="range"
              value={borderRadiusValue}
              onChange={(e) => setBorderRadius(`${e.target.value}px`)}
              onMouseUp={handleUpdate}
              onTouchEnd={handleUpdate}
              min="0"
              max="32"
              step="4"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0px</span>
              <span>32px</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div
              style={{
                backgroundColor,
                padding,
                borderRadius,
              }}
              className="min-h-[100px] border border-gray-200"
            >
              {children || (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">Section content will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor,
        padding,
        borderRadius,
      }}
      className="w-full"
    >
      {children}
    </div>
  )
}
