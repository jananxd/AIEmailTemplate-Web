import { useState, useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function ButtonBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  // Initialize hooks at the top - before any conditional returns
  const [label, setLabel] = useState('')
  const [href, setHref] = useState('')
  const [target, setTarget] = useState<'_blank' | '_self'>('_blank')

  // Sync state with block props
  useEffect(() => {
    if (block.type === 'button') {
      setLabel(block.label || '')
      setHref(block.href || '')
      setTarget(block.target || '_blank')
    }
  }, [block])

  // Type guard to ensure we have a button block
  if (block.type !== 'button') {
    return null
  }

  const handleSave = () => {
    onUpdate({ label, href, target })
    onEditToggle()
  }

  return (
    <BaseBlock
      type="button"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Click me"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`new-tab-${block.id}`}
              checked={target === '_blank'}
              onChange={(e) => setTarget(e.target.checked ? '_blank' : '_self')}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={`new-tab-${block.id}`} className="text-sm text-gray-700">
              Open in new tab
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="text-center">
          <a
            href={href || '#'}
            target={target}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            {label || 'Button Text'}
          </a>
        </div>
      )}
    </BaseBlock>
  )
}
