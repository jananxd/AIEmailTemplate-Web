# Phase 4: SSE Email Generation - Frontend Integration

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Integrate Server-Sent Events (SSE) for non-blocking, real-time email generation with progress updates.

**Why:** Current implementation blocks the UI for 10-30 seconds while waiting for OpenAI to generate emails. SSE provides real-time progress updates and better UX.

**Architecture:** Replace blocking `POST /emails/generate` with streaming `POST /emails/generate/stream` using EventSource API for real-time progress updates.

**Prerequisites:** Backend Phase 1 must be completed (SSE endpoint implemented at `/emails/generate/stream`).

**Tech Stack:** React 19, TypeScript, EventSource API (native browser API)

---

## Task 1: Add SSE Generation Method to API Client

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add EventSource-based generation method**

Add this method to the `ApiClient` class in `src/lib/api.ts`:

```typescript
/**
 * Generate email with real-time progress updates via Server-Sent Events
 * @param formData - FormData with prompt, project_id, reference_image, etc.
 * @param callbacks - Progress, success, and error handlers
 * @returns EventSource instance (can be closed to cancel)
 */
generateEmailStream(
  formData: FormData,
  callbacks: {
    onProgress: (step: string, message: string) => void
    onSuccess: (email: Email) => void
    onError: (error: string, details?: string) => void
  }
): EventSource {
  // Build query string from FormData (EventSource doesn't support POST body)
  const params = new URLSearchParams()

  // Extract text fields from FormData
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      params.append(key, value)
    }
  }

  // For file uploads, we need to use a different approach
  // Option 1: Upload file first, then pass URL
  // Option 2: Use multipart endpoint that accepts both SSE and file upload

  const url = `${this.baseURL}/emails/generate/stream?${params.toString()}`

  const eventSource = new EventSource(url, {
    withCredentials: true, // Include cookies if needed
  })

  // Handle SSE messages
  eventSource.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'progress':
          callbacks.onProgress(data.step, data.message)
          break

        case 'success':
          callbacks.onSuccess(data.email)
          eventSource.close()
          break

        case 'error':
          callbacks.onError(data.error, data.details)
          eventSource.close()
          break
      }
    } catch (error) {
      console.error('[SSE] Failed to parse message:', error)
      callbacks.onError('Invalid server response')
      eventSource.close()
    }
  })

  // Handle connection errors
  eventSource.onerror = (error) => {
    console.error('[SSE] Connection error:', error)
    callbacks.onError('Connection lost to server')
    eventSource.close()
  }

  return eventSource
}
```

**Note:** SSE with EventSource has limitations with POST bodies and file uploads. We have two options:

**Option A (Recommended):** Upload file first, then stream generation
```typescript
async generateEmailWithStream(
  prompt: string,
  options: {
    projectId?: string
    referenceImage?: File
    onProgress: (step: string, message: string) => void
  }
): Promise<Email> {
  return new Promise(async (resolve, reject) => {
    let referenceImageUrl: string | undefined

    // Step 1: Upload image if provided
    if (options.referenceImage) {
      options.onProgress('uploading', 'Uploading reference image...')
      try {
        const { url } = await this.uploadImage(options.referenceImage)
        referenceImageUrl = url
      } catch (error) {
        reject(error)
        return
      }
    }

    // Step 2: Start SSE stream
    const formData = new FormData()
    formData.append('prompt', prompt)
    if (options.projectId) formData.append('project_id', options.projectId)
    if (referenceImageUrl) formData.append('reference_image_url', referenceImageUrl)

    const eventSource = this.generateEmailStream(formData, {
      onProgress: options.onProgress,
      onSuccess: (email) => resolve(email),
      onError: (error, details) => reject(new Error(details || error)),
    })

    // Cleanup on promise settlement
    return eventSource
  })
}
```

**Option B:** Use fetch with ReadableStream (more complex but supports multipart)

For this implementation, **use Option A** as it's simpler and cleaner.

**Step 2: Add the wrapper method to ApiClient**

Add this to `src/lib/api.ts`:

```typescript
/**
 * Generate email with SSE streaming and automatic image upload
 */
async generateEmailWithStream(
  prompt: string,
  options: {
    projectId?: string
    referenceImage?: File
    onProgress: (step: string, message: string) => void
  }
): Promise<Email> {
  return new Promise(async (resolve, reject) => {
    let referenceImageUrl: string | undefined

    // Upload image first if provided
    if (options.referenceImage) {
      options.onProgress('uploading_image', 'Uploading reference image...')
      try {
        const { url } = await this.uploadImage(options.referenceImage)
        referenceImageUrl = url
      } catch (error) {
        options.onProgress('error', 'Image upload failed')
        reject(error)
        return
      }
    }

    // Build FormData for SSE request
    const formData = new FormData()
    formData.append('prompt', prompt)
    if (options.projectId) formData.append('project_id', options.projectId)
    if (referenceImageUrl) formData.append('reference_image_url', referenceImageUrl)

    // Start SSE stream
    this.generateEmailStream(formData, {
      onProgress: options.onProgress,
      onSuccess: (email) => resolve(email),
      onError: (error, details) => {
        reject(new Error(details || error))
      },
    })
  })
}
```

**Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add SSE email generation with real-time progress updates"
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
}

const STEP_LABELS: Record<string, string> = {
  uploading_image: 'Uploading Image',
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
    </div>
  )
}
```

**Step 2: Commit**

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
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: projectsData } = useProjects()
  const projects = projectsData?.projects || []

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    setIsGenerating(true)
    setError(null)
    setProgressStep('validating')
    setProgressMessage('Starting generation...')

    try {
      const email = await api.generateEmailWithStream(prompt, {
        projectId: selectedProjectId || undefined,
        referenceImage: imageFile,
        onProgress: (step, message) => {
          setProgressStep(step)
          setProgressMessage(message)
        },
      })

      // Success! Navigate to email detail page
      navigate(`/email/${email.id}`)
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate email')
      setProgressStep('error')
      setProgressMessage('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
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
        {projects.length > 0 && !isGenerating && (
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
        {!isGenerating && (
          <>
            <SamplePrompts onSelectPrompt={setSelectedPrompt} />
            <GenerationInput
              onGenerate={handleGenerate}
              isLoading={false}
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
          />
        )}

        {/* Error Display */}
        {error && !isGenerating && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Generation Failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: integrate SSE email generation in home page"
```

---

## Task 4: Add Cancellation Support (Optional Enhancement)

**Files:**
- Modify: `src/components/generation/GenerationProgress.tsx`
- Modify: `src/pages/Home.tsx`

**Step 1: Add cancel button to progress component**

Modify `GenerationProgress.tsx` to accept cancel callback:

```typescript
interface GenerationProgressProps {
  step: string
  message: string
  status: 'loading' | 'success' | 'error'
  onCancel?: () => void
}

export default function GenerationProgress({
  step,
  message,
  status,
  onCancel,
}: GenerationProgressProps) {
  // ... (keep existing code)

  return (
    <div className="space-y-6 py-8">
      {/* ... (keep existing content) */}

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

**Step 2: Track EventSource in Home page for cancellation**

Modify `Home.tsx` to support cancellation:

```typescript
const [eventSource, setEventSource] = useState<EventSource | null>(null)

const handleGenerate = async (prompt: string, imageFile?: File) => {
  // ... (keep existing setup)

  try {
    // Store EventSource reference for cancellation
    let sourceRef: EventSource | null = null

    const email = await new Promise<Email>((resolve, reject) => {
      const source = api.generateEmailStream(
        // ... formData
        {
          onProgress: (step, message) => {
            setProgressStep(step)
            setProgressMessage(message)
          },
          onSuccess: resolve,
          onError: (error, details) => reject(new Error(details || error)),
        }
      )

      sourceRef = source
      setEventSource(source)
    })

    navigate(`/email/${email.id}`)
  } catch (err) {
    // ... (keep existing error handling)
  } finally {
    setEventSource(null)
    setIsGenerating(false)
  }
}

const handleCancel = () => {
  if (eventSource) {
    eventSource.close()
    setEventSource(null)
  }
  setIsGenerating(false)
  setProgressStep('')
  setProgressMessage('')
}

// Pass cancel handler to progress component
{isGenerating && (
  <GenerationProgress
    step={progressStep}
    message={progressMessage}
    status="loading"
    onCancel={handleCancel}
  />
)}
```

**Step 3: Commit**

```bash
git add src/components/generation/GenerationProgress.tsx src/pages/Home.tsx
git commit -m "feat: add cancel support for email generation"
```

---

## Testing & Verification

### Manual Testing

1. **Start generation with progress tracking:**
   - Navigate to home page
   - Enter a prompt
   - Click generate
   - Verify progress indicators appear
   - Verify step-by-step progress updates

2. **Test with project:**
   - Select a project
   - Generate email
   - Verify "Loading brand settings" step appears

3. **Test with reference image:**
   - Attach an image
   - Generate email
   - Verify "Uploading image" and "Analyzing reference" steps

4. **Test cancellation:**
   - Start generation
   - Click cancel button
   - Verify generation stops
   - Verify can start new generation

5. **Test error handling:**
   - Disconnect network mid-generation
   - Verify error message appears
   - Verify can retry

---

## Summary

This phase adds **real-time email generation** with SSE streaming:

**Benefits:**
- ✅ Non-blocking UI during generation
- ✅ Real-time progress updates
- ✅ Better user experience (10-30 second wait feels shorter)
- ✅ Ability to cancel mid-flight
- ✅ Clear error handling

**Completed Tasks:**
1. Added `generateEmailStream()` to API client
2. Created `GenerationProgress` component
3. Updated Home page with SSE integration
4. Added cancellation support

**Estimated Effort:** 3-4 hours

**Dependencies:** Requires backend SSE endpoint (`POST /emails/generate/stream`)

After completing this phase, users will see real-time progress as their emails are generated! 🎉
