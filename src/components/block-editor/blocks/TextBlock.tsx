import { useState, useEffect, useRef } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function TextBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  // Initialize hooks at the top - before any conditional returns
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync state with block props
  useEffect(() => {
    if (block.type === 'text') {
      setText(block.text || '')
    }
  }, [block])

  // Focus textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // Type guard to ensure we have a text block
  if (block.type !== 'text') {
    return null
  }

  const handleSave = () => {
    onUpdate({ text })
    onEditToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (block.type === 'text') {
        setText(block.text || '')
      }
      onEditToggle()
    }
  }

  return (
    <BaseBlock
      type="text"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 text-xs text-gray-500">
            <span>Click outside or press Esc to save</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 cursor-text whitespace-pre-wrap">
          {text || 'Click to edit text...'}
        </p>
      )}
    </BaseBlock>
  )
}
