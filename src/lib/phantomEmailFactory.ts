import type { Email } from '../types'
import type { GenerationState } from '../store/generationStore'

/**
 * Create a temporary "phantom" Email object from GenerationState
 * to display in sidebar before backend persistence
 */
export function createPhantomEmail(generation: GenerationState): Email {
  // Extract subject from prompt (first 50 chars) or use default
  const subject = generation.prompt.length > 50
    ? generation.prompt.slice(0, 47) + '...'
    : generation.prompt || 'Generating...'

  return {
    id: generation.id,
    meta: {
      subject,
      previewText: generation.message,
    },
    jsxSource: '// Generating...',
    propsSchema: {},
    variables: [],
    prompt: generation.prompt,
    projectId: generation.projectId || undefined,
    createdAt: new Date(generation.createdAt).toISOString(),
    updatedAt: new Date(generation.createdAt).toISOString(),
  }
}
