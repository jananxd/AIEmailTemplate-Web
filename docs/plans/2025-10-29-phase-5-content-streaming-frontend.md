# ChatGPT-Style Content Streaming - Frontend

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display email structure and text appearing progressively as OpenAI generates it (like ChatGPT), parsing partial JSON and rendering with React Email in real-time.

**Architecture:** Consume content streaming SSE endpoint, accumulate and parse partial JSON, render incomplete email structure with animated text appearance.

**Tech Stack:** React 19, TypeScript, React Email, SSE (ReadableStream)

**Prerequisites:** Backend content streaming endpoint must be implemented (Plan B-BE)

---

## Task 1: Add Content Streaming Method to API Client

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add content streaming API method**

Add this new method to the `ApiClient` class after the existing `generateEmailStream` method:

```typescript
/**
 * Generate email with real-time content streaming (ChatGPT-style)
 * Shows email structure + text appearing progressively
 *
 * @param data - Generation request data
 * @param callbacks - Progress, content chunk, success, and error handlers
 * @returns AbortController (can be used to cancel)
 */
async generateEmailContentStream(
  data: GenerateEmailRequest,
  callbacks: {
    onProgress: (step: string, message: string) => void
    onContentChunk: (chunk: string) => void
    onSuccess: (email: Email) => void
    onError: (error: string, details?: string) => void
  }
): Promise<AbortController> {
  // Build FormData
  const formData = new FormData()
  formData.append('prompt', data.prompt)

  if (data.projectId) {
    formData.append('project_id', data.projectId)
  }

  if (data.attachedImage) {
    formData.append('reference_image', data.attachedImage)
  }

  if (data.userId) {
    formData.append('user_id', data.userId)
  }

  // Create AbortController for cancellation
  const abortController = new AbortController()

  try {
    const response = await fetch(`${this.baseURL}/emails/generate/stream/content`, {
      method: 'POST',
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: formData,
      signal: abortController.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'UnknownError',
        message: 'An unknown error occurred',
      }))
      callbacks.onError(error.error, error.message)
      return abortController
    }

    // Read SSE stream
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      callbacks.onError('No response body')
      return abortController
    }

    // Process stream
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          try {
            const event = JSON.parse(data)

            switch (event.type) {
              case 'progress':
                callbacks.onProgress(event.step, event.message)
                break

              case 'content':
                // New: Stream content chunks
                callbacks.onContentChunk(event.chunk)
                break

              case 'success':
                callbacks.onSuccess(transformEmailResponse(event.email))
                break

              case 'error':
                callbacks.onError(event.error, event.details)
                break
            }
          } catch (error) {
            console.error('[SSE] Failed to parse event:', error, data)
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onError('Generation cancelled')
      } else {
        callbacks.onError('Connection error', error.message)
      }
    } else {
      callbacks.onError('Unknown error')
    }
  }

  return abortController
}
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add content streaming API method"
```

---

## Task 2: Create Streaming Email Renderer Component

**Files:**
- Create: `src/components/email/StreamingEmailRenderer.tsx`

**Step 1: Create streaming renderer component**

Create `src/components/email/StreamingEmailRenderer.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Loader2 } from 'lucide-react'

interface StreamingEmailRendererProps {
  partialContent: string
  isComplete: boolean
}

export default function StreamingEmailRenderer({
  partialContent,
  isComplete,
}: StreamingEmailRendererProps) {
  const [parsedData, setParsedData] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    // Try to parse partial JSON
    try {
      // Attempt to parse as-is first
      const parsed = JSON.parse(partialContent)
      setParsedData(parsed)
      setParseError(null)
    } catch {
      // If parsing fails, try to fix incomplete JSON
      try {
        // Add closing braces for incomplete objects
        const fixed = fixIncompleteJSON(partialContent)
        const parsed = JSON.parse(fixed)
        setParsedData(parsed)
        setParseError(null)
      } catch (error) {
        // Still can't parse - show raw content
        setParseError('Parsing...')
      }
    }
  }, [partialContent])

  if (parseError && !isComplete) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating email structure...</span>
        </div>
      </div>
    )
  }

  if (!parsedData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Waiting for content...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Subject */}
      {parsedData.subject && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Subject</h3>
          <p className="text-lg font-semibold text-gray-900">
            {parsedData.subject}
            {!isComplete && <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1" />}
          </p>
        </div>
      )}

      {/* Email Preview */}
      {parsedData.preview && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Preview Text</h3>
          <p className="text-sm text-gray-700">
            {parsedData.preview}
            {!isComplete && <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1" />}
          </p>
        </div>
      )}

      {/* Email Structure */}
      {parsedData.jsonStructure && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Email Content</h3>
          <div className="space-y-4">
            {renderBlocks(parsedData.jsonStructure.root?.children || [], !isComplete)}
          </div>
        </div>
      )}

      {!isComplete && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating content...</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Render email blocks with streaming indicator
 */
function renderBlocks(blocks: any[], isStreaming: boolean): React.ReactNode {
  return blocks.map((block, index) => {
    const isLastBlock = index === blocks.length - 1

    switch (block.type) {
      case 'heading':
        return (
          <div key={block.id} className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {block.props.text || block.props.content || ''}
              {isStreaming && isLastBlock && (
                <span className="inline-block w-2 h-6 bg-blue-600 animate-pulse ml-1" />
              )}
            </h2>
          </div>
        )

      case 'paragraph':
      case 'text':
        return (
          <div key={block.id} className="space-y-2">
            <p className="text-gray-700 leading-relaxed">
              {block.props.text || block.props.content || ''}
              {isStreaming && isLastBlock && (
                <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1" />
              )}
            </p>
          </div>
        )

      case 'button':
        return (
          <div key={block.id} className="space-y-2">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
              disabled
            >
              {block.props.text || block.props.label || 'Button'}
              {isStreaming && isLastBlock && (
                <span className="inline-block w-2 h-5 bg-blue-100 animate-pulse ml-1" />
              )}
            </button>
          </div>
        )

      case 'image':
        return (
          <div key={block.id} className="space-y-2">
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Image: {block.props.alt || block.props.src || 'Untitled'}
              </p>
            </div>
          </div>
        )

      case 'divider':
        return (
          <div key={block.id} className="py-2">
            <hr className="border-gray-300" />
          </div>
        )

      default:
        return (
          <div key={block.id} className="space-y-2">
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-500">
                {block.type}: {JSON.stringify(block.props).slice(0, 50)}...
              </p>
            </div>
          </div>
        )
    }
  })
}

/**
 * Attempt to fix incomplete JSON by adding closing braces
 */
function fixIncompleteJSON(partial: string): string {
  let fixed = partial.trim()

  // Count opening and closing braces
  const openBraces = (fixed.match(/{/g) || []).length
  const closeBraces = (fixed.match(/}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/]/g) || []).length

  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixed += ']'
  }

  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixed += '}'
  }

  return fixed
}
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/email/StreamingEmailRenderer.tsx
git commit -m "feat: add streaming email renderer component"
```

---

## Task 3: Update EmailDetail Page to Use Content Streaming

**Files:**
- Modify: `src/pages/EmailDetail.tsx`

**Step 1: Add content streaming state and logic**

Add these state variables after existing hooks:

```typescript
const [streamingContent, setStreamingContent] = useState('')
const [isContentStreaming, setIsContentStreaming] = useState(false)
const [streamComplete, setStreamComplete] = useState(false)
```

**Step 2: Update the generation progress section**

Replace the existing generation progress block with:

```typescript
// Show generation progress if generating
if (isGenerating && generationState) {
  // If we have streaming content, show it
  if (isContentStreaming || streamingContent) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Generating Email...
            </h2>
            <button
              onClick={handleCancelGeneration}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {generationState.message}
          </p>
        </div>

        <StreamingEmailRenderer
          partialContent={streamingContent}
          isComplete={streamComplete}
        />
      </div>
    )
  }

  // Otherwise show progress indicator
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

**Step 3: Add import for StreamingEmailRenderer**

```typescript
import StreamingEmailRenderer from '../components/email/StreamingEmailRenderer'
```

**Step 4: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/pages/EmailDetail.tsx
git commit -m "feat: integrate content streaming in email detail page"
```

---

## Task 4: Update Generation Manager to Support Content Streaming

**Files:**
- Modify: `src/lib/generationManager.ts`

**Step 1: Add content streaming option**

Add this new method to the `GenerationManager` class:

```typescript
async startContentStreaming(
  emailId: string,
  request: GenerateEmailRequest,
  onContentChunk: (chunk: string) => void
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

  let accumulatedContent = ''

  try {
    // Start content streaming SSE
    const abortController = await api.generateEmailContentStream(request, {
      onProgress: (step, message) => {
        store.updateProgress(emailId, step, message)
      },
      onContentChunk: (chunk) => {
        accumulatedContent += chunk
        onContentChunk(accumulatedContent)
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
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/generationManager.ts
git commit -m "feat: add content streaming support to generation manager"
```

---

## Task 5: Update Home Page to Offer Content Streaming Option

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Add toggle for content streaming**

Add state for streaming preference:

```typescript
const [enableContentStreaming, setEnableContentStreaming] = useState(true)
```

**Step 2: Add UI toggle**

Add this before the generation input:

```typescript
{/* Content Streaming Toggle */}
<div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <input
    type="checkbox"
    id="contentStreaming"
    checked={enableContentStreaming}
    onChange={(e) => setEnableContentStreaming(e.target.checked)}
    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
  />
  <label htmlFor="contentStreaming" className="text-sm text-gray-700">
    Enable real-time content streaming (ChatGPT-style)
  </label>
</div>
```

**Step 3: Update handleGenerate to use content streaming if enabled**

This is optional - for now we can keep using the existing progress-only streaming. The EmailDetail page will automatically use content streaming when the backend supports it.

**Step 4: Verify build**

```bash
bun run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: add content streaming toggle option"
```

---

## Task 6: Testing & Verification

**Manual Testing Checklist:**

1. **Test content streaming:**
   - Generate email with content streaming enabled
   - Navigate to detail page
   - Verify you see JSON structure appearing progressively
   - Verify text has blinking cursor effect
   - Verify blocks appear one by one

2. **Test with long content:**
   - Use complex prompt requiring long email
   - Verify streaming feels smooth
   - Verify no visual glitches

3. **Test incomplete JSON handling:**
   - Monitor during generation
   - Verify partial JSON doesn't crash renderer
   - Verify auto-completion of missing braces works

4. **Test cancellation during streaming:**
   - Start generation
   - Cancel mid-stream
   - Verify cleanup happens properly

5. **Test backward compatibility:**
   - Disable content streaming toggle
   - Verify old progress-only streaming still works
   - Verify no regression

**Expected Results:**
- ✅ Email structure appears progressively
- ✅ Text has typing effect with cursor
- ✅ Partial JSON renders without crashes
- ✅ Smooth streaming experience
- ✅ Backward compatible with existing flow

---

## Summary

This implementation adds ChatGPT-style content streaming to the frontend:

**Benefits:**
- ✅ Real-time email content preview
- ✅ Progressive JSON structure rendering
- ✅ Animated text appearance
- ✅ Handles incomplete JSON gracefully
- ✅ Backward compatible

**Completed Tasks:**
1. Added content streaming API method
2. Created streaming email renderer component
3. Updated EmailDetail page for content streaming
4. Updated generation manager for content streaming
5. Added content streaming toggle option
6. Manual testing checklist

**Event Types Consumed:**
- `progress` - Progress step updates
- `content` - JSON chunks to accumulate and render
- `success` - Final complete email
- `error` - Generation failures

**Estimated Effort:** 3-4 hours

**Next Steps:** Test end-to-end with backend content streaming endpoint.
