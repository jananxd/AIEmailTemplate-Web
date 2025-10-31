import { useState, useRef, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface UserMenuProps {
  sidebarCollapsed?: boolean
}

export default function UserMenu({ sidebarCollapsed = false }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  // Get first letter of email for avatar
  const avatarLetter = user.email.charAt(0).toUpperCase()

  // When sidebar is collapsed, show only avatar
  if (sidebarCollapsed) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors w-full"
          title={user.email}
        >
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
            {avatarLetter}
          </div>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    )
  }

  // When sidebar is expanded, show full profile
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors w-full"
      >
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
          {avatarLetter}
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.email}
          </p>
          <p className="text-xs text-gray-500">Signed in</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
