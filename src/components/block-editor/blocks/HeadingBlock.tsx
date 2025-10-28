import { useState, useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function HeadingBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  // Type guard to ensure we have a heading block
  if (block.type !== 'heading') {
    return null
  }

  const [text, setText] = useState(block.text || '')
  const [level, setLevel] = useState(block.level || 1)

  useEffect(() => {
    if (block.type === 'heading') {
      setText(block.text || '')
      setLevel(block.level || 1)
    }
  }, [block])

  const handleSave = () => {
    onUpdate({ text, level })
    onEditToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      if (block.type === 'heading') {
        setText(block.text || '')
        setLevel(block.level || 1)
      }
      onEditToggle()
    }
  }

  const headingClasses = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
  }

  return (
    <BaseBlock
      id={block.id}
      type="heading"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Enter heading text..."
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 text-xs text-gray-500">
            <span>Press Enter to save, Esc to cancel</span>
          </div>
        </div>
      ) : (
        <h1 className={`${headingClasses[level as 1 | 2 | 3]} cursor-text`}>
          {text || 'Click to edit heading...'}
        </h1>
      )}
    </BaseBlock>
  )
}
