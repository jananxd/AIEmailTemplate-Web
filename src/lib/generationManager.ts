import { api } from './api'
import { useGenerationStore } from '../store/generationStore'
import type { GenerateEmailRequest } from '../types'
import { toast } from 'sonner'

class GenerationManager {
  private static instance: GenerationManager
  private isRecovering = false

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
    request: GenerateEmailRequest,
    onSuccessNavigate?: (emailId: string) => void
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

    // Create loading toast
    const toastId = toast.loading('Validating inputs...', {
      description: 'Starting email generation',
      cancel: {
        label: 'Cancel',
        onClick: () => {
          this.cancelGeneration(emailId)
          toast.error('Generation cancelled', { id: toastId })
        }
      }
    })

    // Store toast ID in generation state
    store.setToastId(emailId, toastId)

    try {
      // Start SSE stream
      const abortController = await api.generateEmailStream(request, {
        onProgress: (step, message) => {
          store.updateProgress(emailId, step, message)

          // Update toast with progress
          const gen = store.generations.get(emailId)
          if (gen?.toastId) {
            toast.loading(message, {
              id: gen.toastId,
              description: step,
              cancel: {
                label: 'Cancel',
                onClick: () => {
                  this.cancelGeneration(emailId)
                  toast.error('Generation cancelled', { id: gen.toastId })
                }
              }
            })
          }
        },
        onSuccess: (email) => {
          store.completeGeneration(emailId, email)

          // Show success toast with action button
          const gen = store.generations.get(emailId)
          if (gen?.toastId) {
            toast.success('Email generated successfully!', {
              id: gen.toastId,
              description: email.meta.subject,
              duration: 8000,
              action: {
                label: 'View Email',
                onClick: () => {
                  if (onSuccessNavigate) {
                    onSuccessNavigate(emailId)
                  } else {
                    // Fallback to window.location if callback not provided
                    window.location.href = `/email/${emailId}`
                  }
                }
              }
            })
          }
        },
        onError: (error, details) => {
          store.failGeneration(emailId, details || error)

          // Show error toast
          const gen = store.generations.get(emailId)
          if (gen?.toastId) {
            toast.error('Generation failed', {
              id: gen.toastId,
              description: details || error,
              duration: 8000,
            })
          }
        },
      })

      // Store abort controller
      store.setAbortController(emailId, abortController)
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
    // Prevent concurrent recovery calls (e.g., from StrictMode double-invocation)
    if (this.isRecovering) {
      return
    }

    this.isRecovering = true
    try {
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
    } finally {
      this.isRecovering = false
    }
  }
}

export const generationManager = GenerationManager.getInstance()
