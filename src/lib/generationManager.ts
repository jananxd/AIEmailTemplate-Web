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
          store.completeGeneration(emailId, email)
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
