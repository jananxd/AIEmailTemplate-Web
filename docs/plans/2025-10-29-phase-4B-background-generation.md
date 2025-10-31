# Background Email Generation (Non-Blocking UX) - Frontend

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform email generation from blocking to truly non-blocking background process where users can navigate away, see progress in sidebar, and handle up to 3 concurrent generations with page refresh recovery.

**Architecture:** Use Zustand for global generation state, singleton SSE manager persisting across navigation, localStorage for recovery, and enhanced sidebar components showing loading states.

**Tech Stack:** React 19, TypeScript, Zustand, TanStack Query, SSE (ReadableStream)

---

## Task 1: Install Zustand and Create Generation Store

**Files:**
- Create: `src/store/generationStore.ts`
- Modify: `package.json`

**Step 1: Install Zustand**

```bash
bun add zustand
```

Expected: Package installed successfully

**Step 2: Create generation store**

Create `src/store/generationStore.ts`:

```typescript
import { create } from 'zustand'
import type { Email } from '../types'

export interface GenerationState {
  id: string
  prompt: string
  projectId?: string
  userId: string
  step: string
  message: string
  status: 'generating' | 'completed' | 'error'
  error?: string
  abortController?: AbortController
  createdAt: number
}

interface GenerationStore {
  generations: Map<string, GenerationState>

  // Actions
  startGeneration: (state: Omit<GenerationState, 'step' | 'message' | 'status' | 'createdAt'>) => void
  updateProgress: (id: string, step: string, message: string) => void
  completeGeneration: (id: string, email: Email) => void
  failGeneration: (id: string, error: string) => void
  cancelGeneration: (id: string) => void
  removeGeneration: (id: string) => void

  // Computed
  getInProgressCount: () => number
  canStartNewGeneration: () => boolean
}

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  generations: new Map(),

  startGeneration: (state) => {
    const { generations } = get()

    // Enforce max 3 concurrent
    if (get().getInProgressCount() >= 3) {
      throw new Error('Maximum 3 concurrent generations reached')
    }

    const newGen: GenerationState = {
      ...state,
      step: 'validating',
      message: 'Starting generation...',
      status: 'generating',
      createdAt: Date.now(),
    }

    generations.set(state.id, newGen)
    set({ generations: new Map(generations) })

    // Persist to localStorage
    localStorage.setItem(`generation_${state.id}`, JSON.stringify({
      id: state.id,
      prompt: state.prompt,
      projectId: state.projectId,
      userId: state.userId,
      createdAt: newGen.createdAt,
    }))
  },

  updateProgress: (id, step, message) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen) {
      gen.step = step
      gen.message = message
      set({ generations: new Map(generations) })
    }
  },

  completeGeneration: (id) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen) {
      gen.status = 'completed'
      gen.step = 'completed'
      gen.message = 'Email generated successfully'
      set({ generations: new Map(generations) })

      // Clean up localStorage
      localStorage.removeItem(`generation_${id}`)

      // Remove from store after 2 seconds
      setTimeout(() => {
        get().removeGeneration(id)
      }, 2000)
    }
  },

  failGeneration: (id, error) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen) {
      gen.status = 'error'
      gen.error = error
      gen.step = 'error'
      gen.message = error
      set({ generations: new Map(generations) })

      // Clean up localStorage
      localStorage.removeItem(`generation_${id}`)
    }
  },

  cancelGeneration: (id) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen?.abortController) {
      gen.abortController.abort()
    }

    generations.delete(id)
    set({ generations: new Map(generations) })
    localStorage.removeItem(`generation_${id}`)
  },

  removeGeneration: (id) => {
    const { generations } = get()
    generations.delete(id)
    set({ generations: new Map(generations) })
  },

  getInProgressCount: () => {
    const { generations } = get()
    return Array.from(generations.values()).filter(
      g => g.status === 'generating'
    ).length
  },

  canStartNewGeneration: () => {
    return get().getInProgressCount() < 3
  },
}))
```

**Step 3: Verify build**

```bash
bun run build
```

Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add package.json bun.lockb src/store/generationStore.ts
git commit -m "feat: add Zustand store for generation state management"
```

---

## Task 2: Create Background SSE Manager Singleton

**Files:**
- Create: `src/lib/generationManager.ts`

**Step 1: Create SSE manager singleton**

Create `src/lib/generationManager.ts`:

```typescript
import { api } from './api'
import { useGenerationStore } from '../store/generationStore'
import type { GenerateEmailRequest } from '../types'

class GenerationManager {
  private static instance: GenerationManager

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): GenerationManager {
    if (!GenerationManager.instance) {
      GenerationManager.instance = new GenerationManager()
    }
    return GenerationManager.instance
  }

  async startGeneration(
    emailId: string,
    request: GenerateEmailRequest
  ): Promise<void> {
    const store = useGenerationStore.getState()

    // Check limit
    if (!store.canStartNewGeneration()) {
      throw new Error('Maximum 3 concurrent generations reached. Please wait for one to complete.')
    }

    // Add to store
    store.startGeneration({
      id: emailId,
      prompt: request.prompt,
      projectId: request.projectId,
      userId: request.userId,
    })

    try {
      // Start SSE stream
      const abortController = await api.generateEmailStream(request, {
        onProgress: (step, message) => {
          store.updateProgress(emailId, step, message)
        },
        onSuccess: (email) => {
          store.completeGeneration(emailId)
        },
        onError: (error, details) => {
          store.failGeneration(emailId, details || error)
        },
      })

      // Store abort controller
      const gen = store.generations.get(emailId)
      if (gen) {
        gen.abortController = abortController
      }
    } catch (error) {
      store.failGeneration(
        emailId,
        error instanceof Error ? error.message : 'Failed to start generation'
      )
      throw error
    }
  }

  cancelGeneration(emailId: string): void {
    const store = useGenerationStore.getState()
    store.cancelGeneration(emailId)
  }

  async recoverGenerations(): Promise<void> {
    const store = useGenerationStore.getState()

    // Check localStorage for in-progress generations
    const keys = Object.keys(localStorage).filter(k => k.startsWith('generation_'))

    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        const emailId = data.id

        // Check if email exists in backend (was it completed?)
        try {
          await api.getEmail(emailId)
          // Email exists, generation completed - clean up
          localStorage.removeItem(key)
        } catch {
          // Email doesn't exist - generation was interrupted
          // Could attempt to reconnect here, but for now just clean up
          localStorage.removeItem(key)
        }
      } catch (error) {
        console.error('Failed to recover generation:', error)
      }
    }
  }
}

export const generationManager = GenerationManager.getInstance()
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/lib/generationManager.ts
git commit -m "feat: add singleton generation manager for background SSE"
```

---

## Task 3: Update EmailListItem for Loading States

**Files:**
- Modify: `src/components/sidebar/EmailListItem.tsx`

**Step 1: Add generation state subscription**

Replace the entire file content with:

```typescript
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
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/sidebar/EmailListItem.tsx
git commit -m "feat: add loading state indicators to email list items"
```

---

## Task 4: Update EmailDetail Page for In-Progress Emails

**Files:**
- Modify: `src/pages/EmailDetail.tsx`

**Step 1: Add generation state subscription at the top of the file**

Add these imports and state logic after the existing imports:

```typescript
import { useGenerationStore } from '../store/generationStore'
import GenerationProgress from '../components/generation/GenerationProgress'
import { generationManager } from '../lib/generationManager'
```

**Step 2: Add generation state subscription in the component**

Add this after the existing hooks:

```typescript
// Subscribe to generation state
const generationState = useGenerationStore((state) =>
  state.generations.get(id!)
)

const isGenerating = generationState?.status === 'generating'

const handleCancelGeneration = () => {
  if (id) {
    generationManager.cancelGeneration(id)
    navigate('/')
  }
}
```

**Step 3: Add generation progress UI before the loading check**

Add this before the `if (isLoading)` block:

```typescript
// Show generation progress if generating
if (isGenerating && generationState) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <GenerationProgress
        step={generationState.step}
        message={generationState.message}
        status="loading"
        onCancel={handleCancelGeneration}
      />
    </div>
  )
}
```

**Step 4: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/pages/EmailDetail.tsx
git commit -m "feat: show generation progress in email detail page"
```

---

## Task 5: Update Home Page to Use Background Generation

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `package.json` (add uuid)

**Step 1: Install uuid package**

```bash
bun add uuid
bun add -d @types/uuid
```

**Step 2: Replace Home page content**

Replace the entire `src/pages/Home.tsx` with:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import AuthModal from '../components/auth/AuthModal'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { generationManager } from '../lib/generationManager'
import { useGenerationStore } from '../store/generationStore'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: projectsData } = useProjects()
  const projects = projectsData?.projects || []

  const canStartNew = useGenerationStore((state) => state.canStartNewGeneration())
  const inProgressCount = useGenerationStore((state) => state.getInProgressCount())

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (!canStartNew) {
      setError('Maximum 3 concurrent generations reached. Please wait for one to complete.')
      return
    }

    setError(null)
    const emailId = uuidv4()

    try {
      // Start background generation
      await generationManager.startGeneration(emailId, {
        prompt,
        projectId: selectedProjectId || undefined,
        attachedImage: imageFile,
        userId: user.id,
      })

      // Navigate to detail page (will show progress)
      navigate(`/email/${emailId}`)
    } catch (err) {
      console.error('Failed to start generation:', err)
      setError(err instanceof Error ? err.message : 'Failed to start generation')
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
        {/* Generation Limit Warning */}
        {inProgressCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              {inProgressCount} email{inProgressCount > 1 ? 's' : ''} generating in background.
              {canStartNew ? ` You can start ${3 - inProgressCount} more.` : ' Please wait for one to complete.'}
            </p>
          </div>
        )}

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
          isLoading={!canStartNew}
          defaultPrompt={selectedPrompt}
          onAuthRequired={() => setIsAuthModalOpen(true)}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Dismiss
            </button>
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

**Step 3: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add package.json bun.lockb src/pages/Home.tsx
git commit -m "feat: implement background generation with concurrent limit"
```

---

## Task 6: Add Page Refresh Recovery

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add recovery on app mount**

Replace the entire `src/main.tsx` with:

```typescript
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import { generationManager } from './lib/generationManager'
import App from './App'
import './index.css'

function AppWithRecovery() {
  useEffect(() => {
    // Recover any in-progress generations on mount
    generationManager.recoverGenerations()
  }, [])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppWithRecovery />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
)
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add page refresh recovery for in-progress generations"
```

---

## Task 7: Testing & Verification

**Manual Testing Checklist:**

1. **Start generation and navigate away:**
   - Generate email
   - Navigate to home while generating
   - Verify sidebar shows loading indicator
   - Navigate back to email detail
   - Verify progress continues

2. **Multiple concurrent generations:**
   - Start 3 emails generating
   - Verify all show in sidebar with loading state
   - Try starting 4th - verify error message
   - Wait for one to complete
   - Verify can start new one

3. **Page refresh during generation:**
   - Start generation
   - Refresh page (Cmd+R / Ctrl+R)
   - Verify localStorage cleanup happens
   - Verify no orphaned state

4. **Cancellation:**
   - Start generation
   - Navigate to email detail
   - Click "Cancel Generation"
   - Verify returns to home
   - Verify sidebar no longer shows email

5. **Error handling:**
   - Disconnect network
   - Start generation
   - Verify error appears in sidebar
   - Verify can retry

**Expected Results:**
- ✅ User can navigate freely during generation
- ✅ Up to 3 concurrent generations work
- ✅ Page refresh cleans up properly
- ✅ Sidebar shows real-time progress
- ✅ Cancellation works correctly

---

## Summary

This implementation transforms email generation from blocking to truly non-blocking:

**Benefits:**
- ✅ Non-blocking UI - navigate freely during generation
- ✅ Concurrent generations (max 3)
- ✅ Real-time progress in sidebar
- ✅ Page refresh recovery
- ✅ Global state management with Zustand

**Completed Tasks:**
1. Installed Zustand and created generation store
2. Created background SSE manager singleton
3. Updated EmailListItem with loading states
4. Updated EmailDetail to show progress
5. Updated Home to use background generation
6. Added page refresh recovery
7. Manual testing checklist

**Estimated Effort:** 4-6 hours

**Next Steps:** After this works, consider implementing Plan B (content streaming).
