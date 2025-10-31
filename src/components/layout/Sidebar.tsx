import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Mail } from 'lucide-react'
import SidebarHeader from './SidebarHeader'
import EmailList from '../sidebar/EmailList'
import ProjectList from '../sidebar/ProjectList'
import ProjectModal from '../project/ProjectModal'
import UserMenu from '../auth/UserMenu'
import { useAuth } from '../../hooks/useAuth'
import type { Project } from '../../types/project'

export default function Sidebar() {
  const { user, loading } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleCreateProject = () => {
    setEditingProject(null)
    setShowProjectModal(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  const handleCloseModal = () => {
    setShowProjectModal(false)
    setEditingProject(null)
  }

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen">
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        <nav className="p-2 flex-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center justify-center p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
            title="Home"
          >
            <Home size={20} />
          </NavLink>
        </nav>

        {/* User menu at bottom */}
        {!loading && user && (
          <div className="p-2 border-t border-gray-200">
            <UserMenu sidebarCollapsed={true} />
          </div>
        )}
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen">
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <nav className="flex-1 overflow-y-auto p-4">
        {/* Home Link */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-4 ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        {/* All Emails Section */}
        <div className="mb-6">
          <h3 className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
            <Mail size={14} />
            All Emails
          </h3>
          <EmailList />
        </div>

        {/* Projects Section */}
        <ProjectList
          onEditProject={handleEditProject}
          onCreateProject={handleCreateProject}
        />
      </nav>

      {/* User menu at bottom */}
      {!loading && user && (
        <div className="p-4 border-t border-gray-200">
          <UserMenu sidebarCollapsed={false} />
        </div>
      )}

      {showProjectModal && (
        <ProjectModal
          project={editingProject || undefined}
          onClose={handleCloseModal}
        />
      )}
    </aside>
  )
}
