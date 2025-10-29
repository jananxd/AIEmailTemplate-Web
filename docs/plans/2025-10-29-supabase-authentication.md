# Supabase Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Supabase-based authentication with OAuth (Google/GitHub) for login and email/password registration, using modal-based UI with auth state in bottom-left when authenticated.

**Architecture:** React Context-based auth state management with Supabase Auth client. Modal overlay for login/signup flows. Click-gated prompt input that triggers login modal. Bottom-left user avatar/menu when authenticated, top-right login buttons when unauthenticated.

**Tech Stack:** Supabase Auth, React Context API, TanStack Query for auth state, Tailwind CSS, Lucide icons

---

## Prerequisites

### Supabase Configuration Steps

Before implementing, complete these Supabase setup steps:

1. **Google OAuth Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (Client ID + Secret)
   - Add authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase Dashboard → Authentication → Providers → Google

2. **GitHub OAuth Setup:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create new OAuth App
   - Set authorization callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase Dashboard → Authentication → Providers → GitHub

3. **Email Settings:**
   - In Supabase Dashboard → Authentication → Email
   - Set "Enable email confirmations" to OFF (optional verification)
   - Confirm email templates are configured

---

## Task 1: Install Dependencies and Environment Setup

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `.env` (local only, not committed)

**Step 1: Install Supabase client**

Run: `bun add @supabase/supabase-js`
Expected: Package installed successfully

**Step 2: Create environment example file**

Create `.env.example`:
```bash
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 3: Add actual environment variables**

Add to your local `.env` file:
```bash
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-actual-anon-key]
```

**Step 4: Commit**

```bash
git add package.json bun.lockb .env.example
git commit -m "feat: add Supabase dependency and env setup"
```

---

## Task 2: Create Supabase Client Configuration

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/auth.ts`

**Step 1: Create auth types**

Create `src/types/auth.ts`:
```typescript
export interface User {
  id: string
  email: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export type AuthProvider = 'google' | 'github'
```

**Step 2: Create Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
```

**Step 3: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully without errors

**Step 4: Commit**

```bash
git add src/lib/supabase.ts src/types/auth.ts
git commit -m "feat: add Supabase client and auth types"
```

---

## Task 3: Create Auth Context

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`

**Step 1: Create AuthContext**

Create `src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, AuthProvider } from '../types/auth'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithOAuth: (provider: AuthProvider) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? mapSessionToUser(session) : null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? mapSessionToUser(session) : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const mapSessionToUser = (session: Session): User => ({
    id: session.user.id,
    email: session.user.email || '',
  })

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error: error?.message || null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    return { error: error?.message || null }
  }

  const signInWithOAuth = async (provider: AuthProvider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
```

**Step 2: Create useAuth hook**

Create `src/hooks/useAuth.ts`:
```typescript
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
```

**Step 3: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 4: Commit**

```bash
git add src/contexts/AuthContext.tsx src/hooks/useAuth.ts
git commit -m "feat: add auth context and hook"
```

---

## Task 4: Integrate AuthProvider into App

**Files:**
- Modify: `src/main.tsx:8-16`

**Step 1: Import AuthProvider**

Update `src/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
)
```

**Step 2: Verify app runs**

Run: `bun run dev`
Expected: Dev server starts, no console errors, app loads normally

**Step 3: Stop dev server**

Press: `Ctrl+C`

**Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat: integrate AuthProvider into app"
```

---

## Task 5: Create OAuth Buttons Component

**Files:**
- Create: `src/components/auth/OAuthButtons.tsx`

**Step 1: Create OAuth buttons component**

Create `src/components/auth/OAuthButtons.tsx`:
```typescript
import { Github } from 'lucide-react'
import type { AuthProvider } from '../../types/auth'

interface OAuthButtonsProps {
  onOAuthSignIn: (provider: AuthProvider) => void
  disabled?: boolean
}

export default function OAuthButtons({ onOAuthSignIn, disabled }: OAuthButtonsProps) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onOAuthSignIn('google')}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => onOAuthSignIn('github')}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Github size={20} className="text-gray-700" />
        Continue with GitHub
      </button>
    </div>
  )
}
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/components/auth/OAuthButtons.tsx
git commit -m "feat: add OAuth buttons component"
```

---

## Task 6: Create Login Form Component

**Files:**
- Create: `src/components/auth/LoginForm.tsx`

**Step 1: Create login form**

Create `src/components/auth/LoginForm.tsx`:
```typescript
import { useState, type FormEvent } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import OAuthButtons from './OAuthButtons'

interface LoginFormProps {
  onSuccess: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, signInWithOAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null)
    setLoading(true)

    try {
      await signInWithOAuth(provider)
      // OAuth redirects, so we don't call onSuccess here
    } catch (err) {
      setError('Failed to sign in with ' + provider)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <OAuthButtons onOAuthSignIn={handleOAuthSignIn} disabled={loading} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/components/auth/LoginForm.tsx
git commit -m "feat: add login form component"
```

---

## Task 7: Create Sign Up Form Component

**Files:**
- Create: `src/components/auth/SignUpForm.tsx`

**Step 1: Create sign up form**

Create `src/components/auth/SignUpForm.tsx`:
```typescript
import { useState, type FormEvent } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SignUpFormProps {
  onSuccess: () => void
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error: signUpError } = await signUp(email, password)

    if (signUpError) {
      setError(signUpError)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-xs text-gray-500 text-center">
        Email verification is optional. You can start using the app immediately.
      </p>
    </div>
  )
}
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/components/auth/SignUpForm.tsx
git commit -m "feat: add sign up form component"
```

---

## Task 8: Create Auth Modal Component

**Files:**
- Create: `src/components/auth/AuthModal.tsx`

**Step 1: Create auth modal**

Create `src/components/auth/AuthModal.tsx`:
```typescript
import { useState } from 'react'
import { X } from 'lucide-react'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthTab = 'login' | 'signup'

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')

  if (!isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-600 mt-1">
            {activeTab === 'login'
              ? 'Sign in to continue creating emails'
              : 'Sign up to start creating beautiful emails'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-4">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form content */}
        <div className="px-6 pb-6">
          {activeTab === 'login' ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <SignUpForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/components/auth/AuthModal.tsx
git commit -m "feat: add auth modal with tab switching"
```

---

## Task 9: Create User Menu Component

**Files:**
- Create: `src/components/auth/UserMenu.tsx`

**Step 1: Create user menu**

Create `src/components/auth/UserMenu.tsx`:
```typescript
import { useState, useRef, useEffect } from 'react'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function UserMenu() {
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
          {avatarLetter}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
            {user.email}
          </p>
          <p className="text-xs text-gray-500">Signed in</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
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
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/components/auth/UserMenu.tsx
git commit -m "feat: add user menu with dropdown"
```

---

## Task 10: Add Auth Buttons to Layout (Top Right)

**Files:**
- Modify: `src/components/layout/Layout.tsx:1-17`

**Step 1: Update Layout component**

Replace entire contents of `src/components/layout/Layout.tsx`:
```typescript
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
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Test in dev mode**

Run: `bun run dev`
Expected: Dev server starts, auth buttons visible in top-right when not logged in

**Step 4: Stop dev server**

Press: `Ctrl+C`

**Step 5: Commit**

```bash
git add src/components/layout/Layout.tsx
git commit -m "feat: add auth buttons to layout and user menu in bottom-left"
```

---

## Task 11: Protect Prompt Input with Auth Gate

**Files:**
- Modify: `src/components/generation/GenerationInput.tsx:1-101`

**Step 1: Add auth gate to input**

Update `src/components/generation/GenerationInput.tsx`:
```typescript
import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Paperclip, Send, X, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface GenerationInputProps {
  onGenerate: (prompt: string, image?: File) => void
  isLoading?: boolean
  defaultPrompt?: string
  onAuthRequired?: () => void
}

export default function GenerationInput({
  onGenerate,
  isLoading,
  defaultPrompt = '',
  onAuthRequired,
}: GenerationInputProps) {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPrompt(defaultPrompt)
  }, [defaultPrompt])

  const handleClick = () => {
    if (!user && onAuthRequired) {
      onAuthRequired()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      onAuthRequired?.()
      return
    }

    if (prompt.trim()) {
      onGenerate(prompt, attachedImage || undefined)
    }
  }

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAttachedImage(file)
    }
  }

  const removeImage = () => {
    setAttachedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative" onClick={handleClick}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            user
              ? 'Describe the email you want to create...'
              : 'Click to login and start creating emails...'
          }
          rows={4}
          className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-pointer"
          disabled={isLoading || !user}
          readOnly={!user}
        />

        {!user && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-lg cursor-pointer">
            <div className="flex items-center gap-2 text-gray-600">
              <Lock size={20} />
              <span className="font-medium">Login required to generate emails</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageAttach}
            className="hidden"
            id="image-upload"
            disabled={!user}
          />
          <label
            htmlFor="image-upload"
            className={`p-2 rounded-lg transition-colors ${
              user
                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={user ? 'Attach image' : 'Login to attach images'}
          >
            <Paperclip size={20} />
          </label>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || !user}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title={user ? 'Generate email' : 'Login to generate emails'}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {attachedImage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Paperclip size={16} className="text-blue-600" />
          <span className="text-sm text-blue-900 flex-1">{attachedImage.name}</span>
          <button
            type="button"
            onClick={removeImage}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </form>
  )
}
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/components/generation/GenerationInput.tsx
git commit -m "feat: add auth gate to prompt input"
```

---

## Task 12: Connect Auth Gate to Auth Modal

**Files:**
- Modify: `src/pages/Home.tsx:1-105`

**Step 1: Wire up auth modal trigger**

Update `src/pages/Home.tsx`:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import AuthModal from '../components/auth/AuthModal'
import { useGenerateEmail } from '../hooks/useEmails'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const generateEmail = useGenerateEmail()
  const { data: projectsData } = useProjects()

  const projects = projectsData?.projects || []

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      let attachedImage: string | undefined

      // Upload image if provided
      if (imageFile) {
        const { url } = await api.uploadImage(imageFile)
        attachedImage = url
      }

      // Generate email
      generateEmail.mutate(
        {
          prompt,
          projectId: selectedProjectId || undefined,
          attachedImage,
          userId: user.id,
        },
        {
          onSuccess: (response) => {
            // Navigate to email detail page
            navigate(`/email/${response.email.id}`)
          },
        }
      )
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate email. Please try again.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Create beautiful emails with AI
        </h1>
        <p className="text-lg text-gray-600">
          Describe what you need, and let AI generate professional email templates instantly
        </p>
      </div>

      <div className="space-y-8">
        {/* Project Selector */}
        {projects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (optional)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No project (standalone email)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <SamplePrompts onSelectPrompt={setSelectedPrompt} />

        <GenerationInput
          onGenerate={handleGenerate}
          isLoading={generateEmail.isPending}
          defaultPrompt={selectedPrompt}
          onAuthRequired={() => setIsAuthModalOpen(true)}
        />

        {generateEmail.isPending && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Generating your email template...</p>
          </div>
        )}

        {generateEmail.isError && (
          <div className="text-center py-4 text-red-600">
            <p>Failed to generate email. Please try again.</p>
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
```

**Step 2: Verify no TypeScript errors**

Run: `bun run build`
Expected: Builds successfully

**Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: connect auth gate to auth modal and use user ID"
```

---

## Task 13: Manual Testing

**Files:**
- None (manual testing only)

**Step 1: Start dev server**

Run: `bun run dev`
Expected: Server starts on http://localhost:5173

**Step 2: Test unauthenticated state**

- Open browser to http://localhost:5173
- Verify: Login/Sign Up buttons appear in top-right
- Verify: Prompt input shows "Click to login and start creating emails..."
- Click prompt input
- Verify: Auth modal opens

**Step 3: Test sign up flow**

- Click "Sign Up" tab in modal
- Enter test email and password (min 6 characters)
- Click "Create account"
- Verify: Modal closes on success
- Verify: Top-right buttons disappear
- Verify: User menu appears in bottom-left with avatar
- Verify: Prompt input is now enabled

**Step 4: Test sign out**

- Click user menu in bottom-left
- Verify: Dropdown shows email and "Sign out" button
- Click "Sign out"
- Verify: Returns to unauthenticated state

**Step 5: Test login flow**

- Click "Login" button in top-right
- Enter credentials from step 3
- Click "Sign in"
- Verify: Modal closes, authenticated state restores

**Step 6: Test OAuth (manual if configured)**

- Click "Login" button
- Click "Continue with Google" or "Continue with GitHub"
- Verify: Redirects to OAuth provider
- Complete OAuth flow
- Verify: Returns to app in authenticated state

**Step 7: Stop dev server**

Press: `Ctrl+C`

**Step 8: Note any issues**

Document any bugs found during testing in a comment for later fixing.

---

## Task 14: Update Environment Documentation

**Files:**
- Create: `docs/SUPABASE_SETUP.md`

**Step 1: Create setup guide**

Create `docs/SUPABASE_SETUP.md`:
```markdown
# Supabase Authentication Setup Guide

This guide walks through configuring Supabase authentication for the AI Email Template application.

## Prerequisites

- Supabase account ([sign up here](https://supabase.com))
- Supabase project created

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

4. Add these to your `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URI:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

8. In Supabase Dashboard:
   - Go to **Authentication → Providers**
   - Enable **Google**
   - Paste Client ID and Client Secret
   - Save

## Step 3: Configure GitHub OAuth

1. Go to **GitHub Settings → Developer settings → OAuth Apps**
2. Click **New OAuth App**
3. Fill in details:
   - Application name: Your app name
   - Homepage URL: Your app URL
   - Authorization callback URL:
     ```
     https://[your-project-ref].supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

7. In Supabase Dashboard:
   - Go to **Authentication → Providers**
   - Enable **GitHub**
   - Paste Client ID and Client Secret
   - Save

## Step 4: Configure Email Settings

1. In Supabase Dashboard, go to **Authentication → Email**
2. **Enable email confirmations**: Set to **OFF** (optional verification)
3. Review and customize email templates if desired

## Step 5: Test Authentication

1. Start your development server: `bun run dev`
2. Try signing up with email/password
3. Try logging in with Google (if configured)
4. Try logging in with GitHub (if configured)

## Troubleshooting

### OAuth Popup Blocked
- Ensure popups are allowed for your localhost domain
- Check browser console for errors

### "Invalid redirect URL"
- Verify the redirect URL in OAuth provider settings exactly matches:
  `https://[your-project-ref].supabase.co/auth/v1/callback`

### Email not sending
- Check Supabase logs in Dashboard → Authentication → Logs
- Verify email provider is configured (Supabase uses built-in provider for development)

### Session not persisting
- Clear browser localStorage and cookies
- Check browser console for errors
- Verify environment variables are set correctly

## Security Notes

- Never commit `.env` file with real credentials
- Use environment variables for all sensitive data
- The `VITE_SUPABASE_ANON_KEY` is safe to expose in frontend (it's public)
- Never expose the **service role key** in frontend code
```

**Step 2: Commit**

```bash
git add docs/SUPABASE_SETUP.md
git commit -m "docs: add Supabase authentication setup guide"
```

---

## Task 15: Final Build Verification

**Files:**
- None (verification only)

**Step 1: Clean build**

Run: `rm -rf dist && bun run build`
Expected: Clean build succeeds with no errors

**Step 2: Check for TypeScript errors**

Output should show: `vite build` completed successfully

**Step 3: Preview production build**

Run: `bun run preview`
Expected: Production preview server starts

**Step 4: Quick smoke test**

- Open preview URL
- Verify auth buttons render
- Verify no console errors
- Stop preview server (`Ctrl+C`)

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification of auth implementation"
```

---

## Summary

This plan implements a complete Supabase authentication system with:

✅ Email/password sign up and login
✅ Google OAuth login
✅ GitHub OAuth login
✅ Modal-based auth UI with tab switching
✅ Auth-gated prompt input (click to login)
✅ User menu in bottom-left when authenticated
✅ Login/Sign Up buttons in top-right when unauthenticated
✅ Session persistence across browser restarts
✅ Inline error handling for auth failures
✅ Minimal user data storage (ID + email)

**Next Steps:**
- Complete Supabase OAuth provider configuration
- Test all authentication flows
- Consider adding password reset functionality
- Consider adding profile management page

---

## Related Skills

- @superpowers:test-driven-development - If you want to add tests for auth components
- @superpowers:verification-before-completion - Before marking any task as complete
- @superpowers:systematic-debugging - If you encounter auth-related bugs
