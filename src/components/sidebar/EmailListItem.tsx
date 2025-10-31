import { NavLink } from 'react-router-dom'
import { Trash2, Loader2 } from 'lucide-react'
import { useGenerationStore } from '../../store/generationStore'
import type { Email } from '../../types'

interface EmailListItemProps {
  email: Email
  onDelete: (id: string) => void
}

export default function EmailListItem({ email, onDelete }: EmailListItemProps) {
  // Subscribe to generation state for this email
  const generationState = useGenerationStore((state) =>
    state.generations.get(email.id)
  )

  const isGenerating = generationState?.status === 'generating'
  const hasError = generationState?.status === 'error'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Delete email "${email.meta.subject}"?`)) {
      onDelete(email.id)
    }
  }

  return (
    <NavLink
      to={`/email/${email.id}`}
      className={({ isActive }) =>
        `block px-4 py-3 hover:bg-gray-50 transition-colors border-l-2 ${
          isActive
            ? 'border-blue-600 bg-blue-50'
            : 'border-transparent'
        }`
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isGenerating && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            )}
            <p className="text-sm font-medium text-gray-900 truncate">
              {email.meta.subject || 'Untitled Email'}
            </p>
          </div>

          {isGenerating && generationState && (
            <p className="text-xs text-gray-500 mt-1">
              {generationState.message}
            </p>
          )}

          {hasError && generationState && (
            <p className="text-xs text-red-600 mt-1">
              Failed: {generationState.error}
            </p>
          )}

          {!isGenerating && !hasError && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(email.createdAt)}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
          title="Delete email"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </NavLink>
  )
}
