import { useState } from 'react'
import type { ReactNode } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import Sidebar from './Sidebar'
import UserMenu from '../auth/UserMenu'
import AuthModal from '../auth/AuthModal'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Top bar with auth buttons */}
        {!loading && !user && (
          <div className="flex justify-end items-center gap-2 px-6 py-3 bg-white border-b border-gray-200">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogIn size={18} />
              Login
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <UserPlus size={18} />
              Sign Up
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* User menu in bottom left */}
        {!loading && user && (
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <UserMenu />
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
