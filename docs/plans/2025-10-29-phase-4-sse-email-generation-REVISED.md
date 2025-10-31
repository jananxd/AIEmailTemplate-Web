# Phase 4: SSE Email Generation - Frontend Integration (REVISED)

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Integrate Server-Sent Events (SSE) for non-blocking, real-time email generation with progress updates.

**Why:** Current implementation blocks the UI for 10-30 seconds while waiting for OpenAI to generate emails. SSE provides real-time progress updates and better UX.

**Architecture:** Replace blocking `POST /emails/generate` with streaming `POST /emails/generate/stream` using `fetch` with `ReadableStream` for real-time progress updates.

**Prerequisites:** ✅ Backend SSE endpoint is already implemented at `POST /emails/generate/stream`

**Tech Stack:** React 19, TypeScript, Fetch API with ReadableStream

**Key Changes from Original Plan:**
- Use `fetch` with `ReadableStream` instead of EventSource (EventSource doesn't support POST with body)
- Backend accepts multipart form data directly (no separate image upload needed)
- Include Bearer token in request headers for authentication

---

## Task 1: Add SSE Generation Method to API Client

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add ReadableStream-based generation method**

Add this method to the `ApiClient` class in `src/lib/api.ts`:

```typescript
/**
 * Generate email with real-time progress updates via Server-Sent Events
 * Uses fetch + ReadableStream to support POST with multipart form data
 *
 * @param data - Generation request data
 * @param callbacks - Progress, success, and error handlers
 * @returns AbortController (can be used to cancel)
 */
async generateEmailStream(
  data: GenerateEmailRequest,
  callbacks: {
    onProgress: (step: string, message: string) => void
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
    const response = await fetch(`${this.baseURL}/emails/generate/stream`, {
      method: 'POST',
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        // Don't set Content-Type - browser will set it with boundary for FormData
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
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6) // Remove 'data: ' prefix

          try {
            const event = JSON.parse(data)

            switch (event.type) {
              case 'progress':
                callbacks.onProgress(event.step, event.message)
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

Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add SSE email generation with ReadableStream support"
```

---

## Task 2: Create Generation Progress Component

**Files:**
- Create: `src/components/generation/GenerationProgress.tsx`

**Step 1: Create progress indicator component**

Create `src/components/generation/GenerationProgress.tsx`:

```typescript
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface GenerationProgressProps {
  step: string
  message: string
  status: 'loading' | 'success' | 'error'
  onCancel?: () => void
}

const STEP_LABELS: Record<string, string> = {
  validating: 'Validating',
  loading_brand: 'Loading Brand Settings',
  analyzing_image: 'Analyzing Reference',
  generating: 'Generating Email',
  saving: 'Saving Email',
  error: 'Error',
}

export default function GenerationProgress({
  step,
  message,
  status,
  onCancel,
}: GenerationProgressProps) {
  const steps = [
    'validating',
    'loading_brand',
    'analyzing_image',
    'generating',
    'saving',
  ]

  const currentStepIndex = steps.indexOf(step)

  return (
    <div className="space-y-6 py-8">
      {/* Status Icon */}
      <div className="flex justify-center">
        {status === 'loading' && (
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-16 h-16 text-green-600" />
        )}
        {status === 'error' && (
          <XCircle className="w-16 h-16 text-red-600" />
        )}
      </div>

      {/* Current Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">
          {STEP_LABELS[step] || 'Processing'}
        </p>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const isComplete = index < currentStepIndex
            const isCurrent = s === step
            const isPending = index > currentStepIndex

            return (
              <div key={s} className="flex-1 flex items-center">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${
                      isComplete ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Labels */}
        <div className="flex items-start justify-between mt-2">
          {steps.map((s) => (
            <div key={s} className="flex-1 text-center">
              <p className="text-xs text-gray-500 px-1">
                {STEP_LABELS[s] || s}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Button */}
      {status === 'loading' && onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel Generation
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/components/generation/GenerationProgress.tsx
git commit -m "feat: add generation progress indicator component"
```

---

## Task 3: Update Home Page to Use SSE

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Update Home page with SSE integration**

Replace the generation logic in `src/pages/Home.tsx`:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import GenerationProgress from '../components/generation/GenerationProgress'
import AuthModal from '../components/auth/AuthModal'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const generateEmail = { isPending: isGenerating }

  const { data: projectsData } = useProjects()
  const projects = projectsData?.projects || []

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgressStep('validating')
    setProgressMessage('Starting generation...')

    try {
      const controller = await api.generateEmailStream(
        {
          prompt,
          projectId: selectedProjectId || undefined,
          attachedImage: imageFile,
          userId: user.id,
        },
        {
          onProgress: (step, message) => {
            setProgressStep(step)
            setProgressMessage(message)
          },
          onSuccess: (email) => {
            // Success! Navigate to email detail page
            navigate(`/email/${email.id}`)
          },
          onError: (error, details) => {
            console.error('Generation failed:', error, details)
            setError(details || error)
            setProgressStep('error')
            setProgressMessage('Generation failed. Please try again.')
            setIsGenerating(false)
          },
        }
      )

      setAbortController(controller)
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate email')
      setProgressStep('error')
      setProgressMessage('Generation failed. Please try again.')
      setIsGenerating(false)
    }
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsGenerating(false)
    setProgressStep('')
    setProgressMessage('')
    setError(null)
  }

  const handleRetry = () => {
    setError(null)
    setProgressStep('')
    setProgressMessage('')
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
        {projects.length > 0 && !isGenerating && !error && (
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

        {/* Generation Input */}
        {!isGenerating && !error && (
          <>
            <SamplePrompts onSelectPrompt={setSelectedPrompt} />
            <GenerationInput
              onGenerate={handleGenerate}
              isLoading={generateEmail.isPending}
              defaultPrompt={selectedPrompt}
            />
          </>
        )}

        {/* Progress Indicator */}
        {isGenerating && (
          <GenerationProgress
            step={progressStep}
            message={progressMessage}
            status="loading"
            onCancel={handleCancel}
          />
        )}

        {/* Error Display */}
        {error && !isGenerating && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Generation Failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}
```

**Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds with no errors.

**Step 3: Test in development**

```bash
bun run dev
```

Manual testing checklist:
1. Navigate to home page
2. Enter a prompt and click generate
3. Verify progress indicators appear and update
4. Verify navigation to email detail on success
5. Test cancel button mid-generation
6. Test error handling (invalid prompt, network error)

**Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: integrate SSE email generation in home page with cancellation support"
```

---

## Task 4: Update useGenerateEmail Hook (Optional Cleanup)

**Files:**
- Modify: `src/hooks/useEmails.ts` (if needed)

**Note:** The current `useGenerateEmail` hook uses TanStack Query's `useMutation`, which expects a Promise-based API. Our new SSE implementation uses callbacks instead of promises.

**Options:**
1. **Keep both implementations** - Use the old hook for simple cases, new SSE for UI with progress
2. **Remove old hook** - Force all generation to go through SSE
3. **Create separate hook** - Add `useGenerateEmailStream` alongside existing

**Recommendation:** Keep the existing `useGenerateEmail` hook for now. The Home page now uses `api.generateEmailStream` directly, which is appropriate since it needs fine-grained control over progress callbacks.

**No changes needed for this task.**

---

## Testing & Verification

### Manual Testing

1. **Start generation with progress tracking:**
   - Navigate to home page
   - Enter a prompt
   - Click generate
   - ✅ Verify progress indicators appear
   - ✅ Verify step-by-step progress updates (5 steps)
   - ✅ Verify auto-navigation to email detail on success

2. **Test with project:**
   - Select a project from dropdown
   - Generate email
   - ✅ Verify "Loading Brand Settings" step appears

3. **Test with reference image:**
   - Attach an image
   - Generate email
   - ✅ Verify "Analyzing Reference" step appears

4. **Test cancellation:**
   - Start generation
   - Click "Cancel Generation" button mid-flight
   - ✅ Verify generation stops immediately
   - ✅ Verify can start new generation after canceling

5. **Test error handling:**
   - Enter invalid prompt (empty or too long)
   - ✅ Verify error message appears
   - ✅ Verify "Try Again" button works

6. **Test auth gate:**
   - Sign out
   - Try to generate email
   - ✅ Verify auth modal appears

### Network Testing

Test with Chrome DevTools Network tab:

1. **Verify SSE request:**
   - Open DevTools > Network
   - Start generation
   - ✅ See POST to `/emails/generate/stream`
   - ✅ Request includes Bearer token in headers
   - ✅ Request includes FormData with prompt, project_id, reference_image

2. **Verify streaming response:**
   - ✅ Response type is `text/event-stream`
   - ✅ Data arrives incrementally (not all at once)
   - ✅ Each event has `data: ` prefix

3. **Verify cancellation:**
   - Start generation
   - Click cancel
   - ✅ Request shows as "cancelled" in DevTools

---

## Summary

This phase adds **real-time email generation** with SSE streaming:

**Benefits:**
- ✅ Non-blocking UI during generation
- ✅ Real-time progress updates (5 distinct steps)
- ✅ Better user experience (10-30 second wait feels shorter)
- ✅ Ability to cancel mid-flight
- ✅ Clear error handling with retry
- ✅ Works with authentication (Bearer token)
- ✅ Supports file uploads (multipart form data)

**Completed Tasks:**
1. Added `generateEmailStream()` to API client using fetch + ReadableStream
2. Created `GenerationProgress` component with 5-step indicator
3. Updated Home page with SSE integration and cancellation
4. Kept existing hooks for backward compatibility

**Key Differences from Original Plan:**
- ✅ Uses `fetch` + `ReadableStream` instead of EventSource (supports POST + files)
- ✅ No separate image upload needed (backend accepts multipart directly)
- ✅ Includes Bearer token authentication in headers
- ✅ Properly transforms backend response using `transformEmailResponse()`

**Estimated Effort:** 2-3 hours

**Dependencies:** ✅ Backend SSE endpoint already implemented at `POST /emails/generate/stream`

After completing this phase, users will see real-time progress as their emails are generated! 🎉
