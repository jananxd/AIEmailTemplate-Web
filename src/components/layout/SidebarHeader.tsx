import { Menu, X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
            </svg>
            <span className="font-semibold text-lg">EmailAI</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <button
          onClick={() => navigate('/')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>New Email</span>
        </button>
      )}
    </div>
  )
}
