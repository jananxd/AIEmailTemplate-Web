import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, MoreVertical } from 'lucide-react'
import EmailList from './EmailList'
import type { Project } from '../../types/project'

interface ProjectItemProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
}

export default function ProjectItem({ project, onEdit, onDelete }: ProjectItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div>
      {/* Project Header */}
      <div className="group relative px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          <Folder size={16} className="text-gray-600" />

          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
            {project.name}
          </span>

          <span className="text-xs text-gray-500">
            {project.emailCount}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                  <button
                    onClick={() => {
                      onEdit(project)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete project "${project.name}"?`)) {
                        onDelete(project.id)
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Emails */}
      {isExpanded && (
        <div className="ml-6 mt-1">
          <EmailList projectId={project.id} />
        </div>
      )}
    </div>
  )
}
