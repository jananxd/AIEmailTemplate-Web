import type { ReactNode } from 'react'
import { GripVertical, Settings, Trash2 } from 'lucide-react'
import type { EmailNodeType } from '../../../types'

interface BaseBlockProps {
  type: EmailNodeType
  isEditing: boolean
  onEditToggle: () => void
  onDelete: () => void
  onSettings?: () => void
  children: ReactNode
}

const BLOCK_ICONS: Record<EmailNodeType, string> = {
  section: '📦',
  heading: '📝',
  text: '📄',
  button: '🔘',
  image: '🖼️',
  divider: '➖',
  spacer: '🎨',
}

const BLOCK_LABELS: Record<EmailNodeType, string> = {
  section: 'Section',
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  image: 'Image',
  divider: 'Divider',
  spacer: 'Spacer',
}

export default function BaseBlock({
  type,
  isEditing,
  onEditToggle,
  onDelete,
  onSettings,
  children,
}: BaseBlockProps) {
  return (
    <div
      className={`group relative border rounded-lg transition-all ${
        isEditing
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical size={16} />
        </div>

        <span className="text-sm">{BLOCK_ICONS[type]}</span>
        <span className="text-sm font-medium text-gray-700 flex-1">
          {BLOCK_LABELS[type]}
        </span>

        <div className="flex items-center gap-1">
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          )}

          <button
            onClick={onDelete}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete block"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-4" onClick={onEditToggle}>
        {children}
      </div>
    </div>
  )
}
