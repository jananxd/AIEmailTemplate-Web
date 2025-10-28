import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home } from 'lucide-react'
import SidebarHeader from './SidebarHeader'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <nav className="p-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Home size={20} />
          {!isCollapsed && <span>Home</span>}
        </NavLink>

        {/* Email list and projects will be added later */}
      </nav>
    </aside>
  )
}
