import { NavLink } from 'react-router-dom'
import { Mail, Trash2 } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import type { Email } from '../../types/email'

interface EmailListItemProps {
  email: Email
  onDelete: (id: string) => void
}

export default function EmailListItem({ email, onDelete }: EmailListItemProps) {
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
        `group relative block px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <div className="flex items-start gap-2">
        <Mail size={16} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {email.meta.subject}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(email.createdAt)}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
          title="Delete email"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      </div>
    </NavLink>
  )
}
