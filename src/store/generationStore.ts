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
  toastId?: string | number
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
  setAbortController: (id: string, controller: AbortController) => void
  setToastId: (id: string, toastId: string | number) => void

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

  completeGeneration: (id, email) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen) {
      gen.status = 'completed'
      gen.step = 'completed'
      gen.message = 'Email generated successfully'
      set({ generations: new Map(generations) })

      // Clean up localStorage
      localStorage.removeItem(`generation_${id}`)

      // Insert email directly into React Query cache and invalidate list
      import('../providers/QueryProvider').then(({ queryClient }) => {
        // Insert the email data directly into cache (no refetch needed)
        queryClient.setQueryData(['emails', id], email)

        // Invalidate the emails list to show the new email in sidebar
        queryClient.invalidateQueries({ queryKey: ['emails'] })
      })

      // Remove from store after 3 seconds (safe now that email is in cache)
      setTimeout(() => {
        get().removeGeneration(id)
      }, 3000)
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

  setAbortController: (id, controller) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen) {
      gen.abortController = controller
      set({ generations: new Map(generations) })
    }
  },

  setToastId: (id, toastId) => {
    const { generations } = get()
    const gen = generations.get(id)

    if (gen) {
      gen.toastId = toastId
      set({ generations: new Map(generations) })
    }
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
