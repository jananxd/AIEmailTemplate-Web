# Toast Notifications & Phantom Emails Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace navigation-based generation UX with toast notifications and phantom sidebar entries, allowing users to stay on Home page while emails generate in background.

**Architecture:** Integrate Sonner toast library with existing Zustand generation store. Create phantom Email objects from in-progress generations to display in sidebar before backend persistence. Toast lifecycle mirrors SSE events (validating → generating → saving → success).

**Tech Stack:** Sonner (toast library), Zustand (existing), TanStack Query (existing), React Router v7 (existing)

---

## Task 1: Install Sonner and Add Toaster Component

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`

**Step 1: Install Sonner**

Run:
```bash
bun add sonner
```

Expected: Package added to dependencies

**Step 2: Add Toaster to main.tsx**

In `src/main.tsx`, add import at top:
```typescript
import { Toaster } from 'sonner'
```

Then add `<Toaster />` component after `<BrowserRouter>` opening tag (around line 23):
```typescript
<BrowserRouter>
  <Toaster
    position="top-right"
    toastOptions={{
      duration: Infinity,
      success: { duration: 8000 },
      error: { duration: 8000 }
    }}
    visibleToasts={3}
  />
  <AppWithRecovery />
</BrowserRouter>
```

**Step 3: Verify build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add package.json bun.lockb src/main.tsx
git commit -m "feat: add Sonner toast library and Toaster component

Configure Toaster with top-right position, 3 visible toasts max (matches
generation limit), and custom durations for toast types."
```

---

## Task 2: Update Generation Store to Track Toast IDs

**Files:**
- Modify: `src/store/generationStore.ts:4-15`

**Step 1: Add toastId to GenerationState interface**

In `src/store/generationStore.ts`, update the `GenerationState` interface (lines 4-15) to add `toastId`:

```typescript
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
  toastId?: string | number  // Add this line
}
```

**Step 2: Verify TypeScript compilation**

Run: `bun x tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/store/generationStore.ts
git commit -m "feat: add toastId field to GenerationState interface

Store Sonner toast ID to allow updating same toast instance throughout
generation lifecycle."
```

---

## Task 3: Add Toast Notifications to Generation Manager

**Files:**
- Modify: `src/lib/generationManager.ts`

**Step 1: Import toast from Sonner**

At top of `src/lib/generationManager.ts` (after line 3), add:
```typescript
import { toast } from 'sonner'
```

**Step 2: Create toast on generation start**

In `startGeneration()` method, after `store.startGeneration()` call (around line 36), add:

```typescript
// Create loading toast
const toastId = toast.loading('Validating inputs...', {
  description: 'Starting email generation',
})

// Store toast ID in generation state
store.setToastId(emailId, toastId)
```

**Step 3: Add setToastId action to store**

In `src/store/generationStore.ts`, add to the interface (around line 27):
```typescript
setToastId: (id: string, toastId: string | number) => void
```

Then implement in the store (after line 140):
```typescript
setToastId: (id, toastId) => {
  const { generations } = get()
  const gen = generations.get(id)

  if (gen) {
    gen.toastId = toastId
    set({ generations: new Map(generations) })
  }
},
```

**Step 4: Update toast in onProgress callback**

In `generationManager.ts` inside `api.generateEmailStream()` call (around line 41), update the `onProgress` callback:

```typescript
onProgress: (step, message) => {
  store.updateProgress(emailId, step, message)

  // Update toast with progress
  const gen = store.generations.get(emailId)
  if (gen?.toastId) {
    toast.loading(message, { id: gen.toastId, description: step })
  }
},
```

**Step 5: Update toast in onSuccess callback**

Update the `onSuccess` callback (around line 45):

```typescript
onSuccess: (email) => {
  store.completeGeneration(emailId, email)

  // Show success toast with action button
  const gen = store.generations.get(emailId)
  if (gen?.toastId) {
    toast.success('Email generated successfully!', {
      id: gen.toastId,
      description: email.meta.subject,
      action: {
        label: 'View Email',
        onClick: () => {
          // Import navigate at top of file
          // Will add navigation helper in next step
          window.location.href = `/email/${emailId}`
        }
      }
    })
  }
},
```

**Step 6: Update toast in onError callback**

Update the `onError` callback (around line 48):

```typescript
onError: (error, details) => {
  store.failGeneration(emailId, details || error)

  // Show error toast
  const gen = store.generations.get(emailId)
  if (gen?.toastId) {
    toast.error('Generation failed', {
      id: gen.toastId,
      description: details || error
    })
  }
},
```

**Step 7: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/lib/generationManager.ts src/store/generationStore.ts
git commit -m "feat: integrate toast notifications with generation lifecycle

- Create loading toast when generation starts
- Update toast content on SSE progress events
- Show success toast with 'View Email' action button
- Show error toast on generation failure
- Add setToastId action to store"
```

---

## Task 4: Remove Navigation from Home Page

**Files:**
- Modify: `src/pages/Home.tsx:52-53`

**Step 1: Remove navigate call from handleGenerate**

In `src/pages/Home.tsx`, remove line 53 (the `navigate(/email/${emailId})` call).

The try block should look like this (lines 40-57):
```typescript
try {
  // Generate UUID for new email
  const emailId = uuidv4()

  // Start background generation
  await generationManager.startGeneration(emailId, {
    prompt,
    projectId: selectedProjectId || undefined,
    attachedImage: imageFile,
    userId: user.id,
  })

  // Navigation removed - user stays on Home page
  // Toast will show progress and "View Email" button when done
} catch (err) {
  console.error('Generation failed:', err)
  setError(err instanceof Error ? err.message : 'Failed to start email generation')
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: remove navigation on generation start

Users now stay on Home page while generation runs in background.
Toast notifications show progress and provide 'View Email' action."
```

---

## Task 5: Create Phantom Email Factory

**Files:**
- Create: `src/lib/phantomEmailFactory.ts`

**Step 1: Create phantom email factory helper**

Create new file `src/lib/phantomEmailFactory.ts`:

```typescript
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
    userId: generation.userId,
    meta: {
      subject,
      previewText: generation.message,
    },
    jsonStructure: {
      meta: {
        subject,
        previewText: generation.message,
      },
      root: {
        id: 'temp-root',
        type: 'section',
        children: [],
      },
      version: 2,
    },
    textPlain: '',
    modelInfo: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temp: 0.7,
    },
    createdAt: new Date(generation.createdAt).toISOString(),
    updatedAt: new Date(generation.createdAt).toISOString(),
    projectId: generation.projectId || null,
  }
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/phantomEmailFactory.ts
git commit -m "feat: add phantom email factory for sidebar display

Create temporary Email objects from GenerationState to show in-progress
generations in sidebar before backend persistence."
```

---

## Task 6: Add Phantom Emails to Sidebar

**Files:**
- Modify: `src/App.tsx` (or wherever email list is rendered)

**Step 1: Find the email list rendering location**

The email list is likely in `src/App.tsx` or a `Sidebar` component. Look for where `useEmails()` hook is called and emails are mapped to `<EmailListItem>`.

**Step 2: Import phantom email factory and generation store**

At top of the file:
```typescript
import { useGenerationStore } from './store/generationStore'
import { createPhantomEmail } from './lib/phantomEmailFactory'
```

**Step 3: Get in-progress generations and create phantom emails**

Before the email list rendering, add:
```typescript
// Get in-progress generations
const generations = useGenerationStore((state) =>
  Array.from(state.generations.values())
)

// Create phantom emails for in-progress generations
const phantomEmails = generations
  .filter(gen => gen.status === 'generating')
  .map(gen => createPhantomEmail(gen))

// Merge phantom emails with real emails (phantoms first for visibility)
const allEmails = [...phantomEmails, ...(emails || [])]
```

**Step 4: Use allEmails in the map**

Change the `.map()` that renders `<EmailListItem>` to use `allEmails` instead of `emails`:

```typescript
{allEmails.map((email) => (
  <EmailListItem
    key={email.id}
    email={email}
    onDelete={handleDelete}
  />
))}
```

**Step 5: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 6: Manual test**

Run: `bun run dev`
Test:
1. Click "Generate" on Home page
2. Check sidebar immediately - should see phantom email with "Generating..." text
3. Phantom email should show Loader2 spinner (existing EmailListItem logic)
4. Toast should appear in top-right with progress

Expected: Phantom email appears in sidebar, toast shows progress

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: display phantom emails in sidebar during generation

Merge in-progress generations with real emails to show generating emails
in sidebar before backend persistence. Phantom emails automatically show
loading state via existing EmailListItem logic."
```

---

## Task 7: Fix Toast Navigation (Use React Router)

**Files:**
- Modify: `src/lib/generationManager.ts`

**Step 1: Import useNavigate at module level**

This is tricky because `generationManager` is a singleton and can't use hooks. We need to pass navigate function from React context.

**Option A: Pass navigate function to startGeneration**

Update `startGeneration()` signature in `src/lib/generationManager.ts`:

```typescript
async startGeneration(
  emailId: string,
  request: GenerateEmailRequest,
  onSuccessNavigate?: (emailId: string) => void  // Add this parameter
): Promise<void>
```

Then in the `onSuccess` callback:
```typescript
onSuccess: (email) => {
  store.completeGeneration(emailId, email)

  const gen = store.generations.get(emailId)
  if (gen?.toastId) {
    toast.success('Email generated successfully!', {
      id: gen.toastId,
      description: email.meta.subject,
      action: {
        label: 'View Email',
        onClick: () => {
          if (onSuccessNavigate) {
            onSuccessNavigate(emailId)
          }
        }
      }
    })
  }
},
```

**Step 2: Update Home.tsx to pass navigate**

In `src/pages/Home.tsx`, update the `handleGenerate` call (around line 45):

```typescript
await generationManager.startGeneration(
  emailId,
  {
    prompt,
    projectId: selectedProjectId || undefined,
    attachedImage: imageFile,
    userId: user.id,
  },
  (id) => navigate(`/email/${id}`)  // Pass navigate callback
)
```

**Step 3: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Manual test**

Run: `bun run dev`
Test:
1. Generate an email
2. Wait for completion
3. Click "View Email" in success toast
4. Should navigate to email detail page

Expected: Navigation works via React Router (no page refresh)

**Step 5: Commit**

```bash
git add src/lib/generationManager.ts src/pages/Home.tsx
git commit -m "fix: use React Router navigation in success toast

Pass navigate callback from Home.tsx to generationManager to enable
proper SPA navigation when clicking 'View Email' in success toast."
```

---

## Task 8: Add Cancel Action to Loading Toast (Optional Enhancement)

**Files:**
- Modify: `src/lib/generationManager.ts`

**Step 1: Add cancel action to initial toast**

In `startGeneration()` where toast is created (after line 36):

```typescript
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
```

**Step 2: Preserve cancel action in progress updates**

In the `onProgress` callback:

```typescript
onProgress: (step, message) => {
  store.updateProgress(emailId, step, message)

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
```

**Step 3: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Manual test**

Run: `bun run dev`
Test:
1. Start generation
2. Click "Cancel" button in toast
3. Check that generation stops, phantom email disappears, toast shows "cancelled"

Expected: Cancel functionality works, cleans up state properly

**Step 5: Commit**

```bash
git add src/lib/generationManager.ts
git commit -m "feat: add cancel button to loading toasts

Allow users to cancel in-progress generations directly from toast
notification. Cancel action triggers generationManager.cancelGeneration()
and updates toast to show cancellation."
```

---

## Task 9: Clean Up Debug Logging

**Files:**
- Modify: `src/pages/EmailDetail.tsx:115-123`

**Step 1: Remove or comment out debug console.log**

In `src/pages/EmailDetail.tsx`, remove or comment out the debug logging (lines 115-123):

```typescript
// Debug logging - can be removed after testing
// console.log('EmailDetail Debug:', {
//   id,
//   isGenerating,
//   hasGenerationState: !!generationState,
//   hasLocalStorage: hasGenerationInLocalStorage,
//   isLoading,
//   hasData: !!data,
//   generationStatus: generationState?.status,
// })
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/pages/EmailDetail.tsx
git commit -m "chore: remove debug logging from EmailDetail

Clean up console.log statements added during development."
```

---

## Task 10: Manual Testing & Verification

**Step 1: Test single generation**

Run: `bun run dev`

1. Click "Generate" on Home page
2. Verify: Toast appears top-right with "Validating inputs..."
3. Verify: Phantom email appears in sidebar with spinner
4. Verify: Toast updates to "Generating email with AI..."
5. Verify: Toast updates to "Saving email..."
6. Verify: Success toast appears with "View Email" button
7. Click "View Email"
8. Verify: Navigates to email detail page
9. Verify: Phantom email replaced by real email in sidebar

**Step 2: Test three concurrent generations**

1. Start first generation
2. Start second generation
3. Start third generation
4. Verify: All three toasts visible, stacked vertically
5. Verify: All three phantom emails in sidebar
6. Try to start fourth generation
7. Verify: Error shown (max limit reached)

**Step 3: Test cancellation**

1. Start generation
2. Click "Cancel" in toast
3. Verify: Toast shows "Generation cancelled"
4. Verify: Phantom email disappears from sidebar

**Step 4: Test error handling**

1. (If possible) Trigger API error
2. Verify: Error toast appears with error message
3. Verify: Phantom email disappears from sidebar

**Step 5: Test navigation during generation**

1. Start generation
2. Navigate to different page (About, etc.)
3. Come back to Home
4. Verify: Phantom email still in sidebar
5. Verify: Toast still showing progress

**Step 6: Document any issues**

If any issues found, create new tasks to fix them.

---

## Verification Checklist

- [ ] Sonner installed and Toaster component added
- [ ] Toast appears on generation start
- [ ] Toast updates with SSE progress events
- [ ] Success toast shows "View Email" button
- [ ] Clicking "View Email" navigates correctly
- [ ] Phantom emails appear in sidebar during generation
- [ ] Phantom emails show loading spinner
- [ ] Phantom emails disappear when generation completes
- [ ] Three concurrent generations work (toasts stack)
- [ ] Fourth generation attempt shows error
- [ ] Cancel button stops generation and removes phantom
- [ ] Error handling shows error toast
- [ ] Navigation during generation preserves state
- [ ] No console errors in browser DevTools
- [ ] Build passes: `bun run build`
- [ ] TypeScript compilation passes: `bun x tsc --noEmit`

---

## Notes

- EmailListItem already has loading state logic, so phantom emails automatically show spinners
- Zustand store already enforces 3 concurrent limit in `startGeneration()`
- Success toast auto-dismisses after 8 seconds (configurable in Toaster)
- Loading toasts never auto-dismiss (duration: Infinity)
- Toast IDs are stored in generation state for lifecycle updates
- Phantom email factory extracts subject from prompt (first 50 chars)
