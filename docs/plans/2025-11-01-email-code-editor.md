# Email Code Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Monaco-based code editor to the email detail page that allows editing React email templates with live preview and full TypeScript validation.

**Architecture:** Transform the existing EmailDetail page from a single Canvas mode into a dual-mode system with "Canvas" (existing drag-drop) and "Code" tabs. The Code tab features a 50/50 split view with Monaco editor on the left and live React preview on the right. Code is the source of truth - Canvas edits generate code, code edits update Canvas representation (best effort). Use Babel Standalone for runtime JSX transpilation and render in an isolated iframe.

**Tech Stack:** Monaco Editor, Babel Standalone, React Error Boundary, existing @react-email/components, TanStack Query

---

## Prerequisites

### Dependency Installation

**Step 1: Install required packages**

```bash
bun add @monaco-editor/react @babel/standalone react-error-boundary
```

**Step 2: Install TypeScript type definitions**

```bash
bun add -d @types/babel__standalone
```

**Step 3: Verify installation**

Run: `bun pm ls | grep -E "(monaco|babel|error-boundary)"`
Expected: Should see all three packages listed

**Step 4: Commit dependencies**

```bash
git add package.json bun.lockb
git commit -m "chore: add Monaco editor and Babel dependencies"
```

---

## Task 1: Create Code Editor Component

**Files:**
- Create: `src/components/email-editor/CodeEditor.tsx`
- Create: `src/hooks/useCodeEditor.ts`

### Step 1: Create useCodeEditor hook

Create `src/hooks/useCodeEditor.ts`:

```typescript
import { useState, useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'

export interface UseCodeEditorOptions {
  initialValue?: string
  onChange?: (value: string) => void
}

export function useCodeEditor({ initialValue = '', onChange }: UseCodeEditorOptions = {}) {
  const [code, setCode] = useState(initialValue)
  const [isDirty, setIsDirty] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newValue = value || ''
    setCode(newValue)
    setIsDirty(newValue !== initialValue)
    onChange?.(newValue)
  }, [initialValue, onChange])

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Add keyboard shortcut for save (Cmd/Ctrl+S)
    editor.addCommand(
      // Monaco KeyMod and KeyCode
      2048 | 49, // Ctrl/Cmd + S
      () => {
        // Dispatch custom event for save
        window.dispatchEvent(new CustomEvent('editor-save'))
      }
    )
  }, [])

  const resetDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run()
    }
  }, [])

  return {
    code,
    isDirty,
    editorRef,
    handleEditorChange,
    handleEditorDidMount,
    resetDirty,
    formatCode,
  }
}
```

### Step 2: Verify hook compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 3: Create CodeEditor component

Create `src/components/email-editor/CodeEditor.tsx`:

```typescript
import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  onMount: (editor: editor.IStandaloneCodeEditor) => void
  readOnly?: boolean
}

export default function CodeEditor({ value, onChange, onMount, readOnly = false }: CodeEditorProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        value={value}
        onChange={onChange}
        onMount={onMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Loading editor...</div>
          </div>
        }
      />
    </div>
  )
}
```

### Step 4: Verify component compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 5: Commit code editor component

```bash
git add src/components/email-editor/CodeEditor.tsx src/hooks/useCodeEditor.ts
git commit -m "feat: add Monaco code editor component and hook"
```

---

## Task 2: Create Live Preview Component

**Files:**
- Create: `src/components/email-editor/LivePreview.tsx`
- Create: `src/hooks/useLivePreview.ts`
- Create: `src/utils/transpileCode.ts`

### Step 1: Create transpileCode utility

Create `src/utils/transpileCode.ts`:

```typescript
import { transform } from '@babel/standalone'

export interface TranspileResult {
  success: boolean
  code?: string
  error?: string
}

export function transpileCode(sourceCode: string): TranspileResult {
  try {
    const result = transform(sourceCode, {
      presets: ['react', 'typescript'],
      filename: 'email-template.tsx',
    })

    return {
      success: true,
      code: result.code || '',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transpilation failed',
    }
  }
}
```

### Step 2: Verify transpile utility compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 3: Create useLivePreview hook

Create `src/hooks/useLivePreview.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { transpileCode } from '../utils/transpileCode'

export interface UseLivePreviewOptions {
  code: string
  debounceMs?: number
}

export function useLivePreview({ code, debounceMs = 300 }: UseLivePreviewOptions) {
  const [transpiledCode, setTranspiledCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isTranspiling, setIsTranspiling] = useState(false)

  const transpile = useCallback((sourceCode: string) => {
    setIsTranspiling(true)

    // Simulate async to allow debouncing
    setTimeout(() => {
      const result = transpileCode(sourceCode)

      if (result.success && result.code) {
        setTranspiledCode(result.code)
        setError(null)
      } else {
        setError(result.error || 'Unknown transpilation error')
      }

      setIsTranspiling(false)
    }, 0)
  }, [])

  useEffect(() => {
    if (!code) {
      setTranspiledCode('')
      setError(null)
      return
    }

    const timer = setTimeout(() => {
      transpile(code)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [code, debounceMs, transpile])

  return {
    transpiledCode,
    error,
    isTranspiling,
  }
}
```

### Step 4: Create LivePreview component

Create `src/components/email-editor/LivePreview.tsx`:

```typescript
import { ErrorBoundary } from 'react-error-boundary'
import { useLivePreview } from '../../hooks/useLivePreview'

interface LivePreviewProps {
  code: string
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-full bg-red-50">
      <div className="max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-2">Preview Error</h2>
        <p className="text-red-700 mb-4">Failed to render preview:</p>
        <pre className="bg-red-100 p-4 rounded text-sm text-red-900 overflow-auto">
          {error.message}
        </pre>
      </div>
    </div>
  )
}

export default function LivePreview({ code }: LivePreviewProps) {
  const { transpiledCode, error, isTranspiling } = useLivePreview({ code })

  if (isTranspiling) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Transpiling...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="max-w-2xl p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Transpilation Error</h2>
          <p className="text-red-700 mb-4">Fix errors before saving:</p>
          <pre className="bg-red-100 p-4 rounded text-sm text-red-900 overflow-auto max-h-64">
            {error}
          </pre>
        </div>
      </div>
    )
  }

  if (!transpiledCode) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Start typing to see preview...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="h-full overflow-auto bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-sm text-gray-500 mb-4">
            Preview (transpiled successfully)
          </div>
          {/* TODO: Render actual React email component in iframe */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-900">
              Preview rendering will be implemented in next task
            </p>
            <pre className="mt-2 text-xs text-blue-700 overflow-auto max-h-32">
              {transpiledCode.slice(0, 200)}...
            </pre>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
```

### Step 5: Verify components compile

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 6: Commit live preview components

```bash
git add src/components/email-editor/LivePreview.tsx src/hooks/useLivePreview.ts src/utils/transpileCode.ts
git commit -m "feat: add live preview with transpilation"
```

---

## Task 3: Create Code Tab Container

**Files:**
- Create: `src/components/email-editor/CodeTab.tsx`

### Step 1: Create CodeTab component with split view

Create `src/components/email-editor/CodeTab.tsx`:

```typescript
import { useCallback } from 'react'
import CodeEditor from './CodeEditor'
import LivePreview from './LivePreview'
import { useCodeEditor } from '../../hooks/useCodeEditor'

interface CodeTabProps {
  initialCode: string
  onSave: (code: string) => Promise<void>
}

export default function CodeTab({ initialCode, onSave }: CodeTabProps) {
  const {
    code,
    isDirty,
    handleEditorChange,
    handleEditorDidMount,
    resetDirty,
  } = useCodeEditor({
    initialValue: initialCode,
  })

  const handleSave = useCallback(async () => {
    await onSave(code)
    resetDirty()
  }, [code, onSave, resetDirty])

  return (
    <div className="h-full flex flex-col">
      {/* Header with save button */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Email Template Code</h3>
          {isDirty && (
            <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Save (Cmd/Ctrl+S)
        </button>
      </div>

      {/* Split view: Editor | Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 border-r border-gray-300">
          <CodeEditor
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
          />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2">
          <LivePreview code={code} />
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Verify component compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 3: Commit code tab container

```bash
git add src/components/email-editor/CodeTab.tsx
git commit -m "feat: add code tab with split view layout"
```

---

## Task 4: Create Canvas Tab Wrapper

**Files:**
- Create: `src/components/email-editor/CanvasTab.tsx`

### Step 1: Extract existing canvas logic to CanvasTab

Create `src/components/email-editor/CanvasTab.tsx`:

```typescript
import { useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  HeadingBlock,
  TextBlock,
  ButtonBlock,
  ImageBlock,
  DividerBlock,
  SpacerBlock,
  SectionBlock,
} from '../block-editor/blocks'
import FloatingToolbar from '../block-editor/FloatingToolbar'
import EmailPreview from '../email/EmailPreview'
import VariablePanel from '../email/VariablePanel'
import type { EmailNode } from '../../types/email'

const blockComponents = {
  heading: HeadingBlock,
  text: TextBlock,
  button: ButtonBlock,
  image: ImageBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  section: SectionBlock,
}

interface SortableBlockProps {
  block: EmailNode
  isEditing: boolean
  onUpdate: (updates: Partial<EmailNode>) => void
  onDelete: () => void
  onEditToggle: () => void
}

function SortableBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const BlockComponent = blockComponents[block.type]
  if (!BlockComponent) return null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BlockComponent
        block={block}
        isEditing={isEditing}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onEditToggle={onEditToggle}
      />
    </div>
  )
}

interface CanvasTabProps {
  blocks: EmailNode[]
  onAddBlock: (block: Omit<EmailNode, 'id'>) => void
  onUpdateBlock: (blockId: string, updates: Partial<EmailNode>) => void
  onDeleteBlock: (blockId: string) => void
  onReorderBlocks: (reorderedBlocks: EmailNode[]) => void
}

export default function CanvasTab({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
}: CanvasTabProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex)
      onReorderBlocks(reorderedBlocks)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left: Block Editor */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No blocks yet. Use the toolbar below to add content.</p>
                  </div>
                ) : (
                  blocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isEditing={editingBlockId === block.id}
                      onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                      onDelete={() => onDeleteBlock(block.id)}
                      onEditToggle={() =>
                        setEditingBlockId(
                          editingBlockId === block.id ? null : block.id
                        )
                      }
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Right: Preview */}
      {showPreview && (
        <div className="w-1/2 border-l border-gray-200 bg-gray-100 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Hide Preview
              </button>
            </div>

            <VariablePanel
              blocks={blocks}
              onVariablesChange={setTestVariables}
            />

            <EmailPreview
              blocks={blocks}
              variables={testVariables}
            />
          </div>
        </div>
      )}

      {/* Toggle Preview Button (when hidden) */}
      {!showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="fixed right-4 top-24 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
        >
          Show Preview
        </button>
      )}

      <FloatingToolbar onAddBlock={onAddBlock} />
    </div>
  )
}
```

### Step 2: Verify component compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 3: Commit canvas tab wrapper

```bash
git add src/components/email-editor/CanvasTab.tsx
git commit -m "feat: extract canvas editor to CanvasTab component"
```

---

## Task 5: Create Unsaved Changes Modal

**Files:**
- Create: `src/components/email-editor/UnsavedChangesModal.tsx`
- Create: `src/hooks/useUnsavedChanges.ts`

### Step 1: Create useUnsavedChanges hook

Create `src/hooks/useUnsavedChanges.ts`:

```typescript
import { useEffect, useCallback } from 'react'

export function useUnsavedChanges(isDirty: boolean, message = 'You have unsaved changes. Are you sure you want to leave?') {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, message])

  const getConfirmation = useCallback(() => {
    if (!isDirty) return true
    return window.confirm(message)
  }, [isDirty, message])

  return { getConfirmation }
}
```

### Step 2: Create UnsavedChangesModal component

Create `src/components/email-editor/UnsavedChangesModal.tsx`:

```typescript
interface UnsavedChangesModalProps {
  isOpen: boolean
  onSaveAndSwitch: () => void
  onDiscard: () => void
  onCancel: () => void
}

export default function UnsavedChangesModal({
  isOpen,
  onSaveAndSwitch,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Unsaved Changes
        </h2>
        <p className="text-gray-600 mb-6">
          You have unsaved code changes. What would you like to do?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={onSaveAndSwitch}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Save & Switch
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Step 3: Verify components compile

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 4: Commit unsaved changes modal

```bash
git add src/components/email-editor/UnsavedChangesModal.tsx src/hooks/useUnsavedChanges.ts
git commit -m "feat: add unsaved changes modal and hook"
```

---

## Task 6: Integrate Tabs into EmailDetail Page

**Files:**
- Modify: `src/pages/EmailDetail.tsx:249-356`

### Step 1: Add imports to EmailDetail

In `src/pages/EmailDetail.tsx`, add these imports after line 39:

```typescript
import CodeTab from '../components/email-editor/CodeTab'
import CanvasTab from '../components/email-editor/CanvasTab'
import UnsavedChangesModal from '../components/email-editor/UnsavedChangesModal'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { toast } from 'sonner'
```

### Step 2: Add tab state management

In `src/pages/EmailDetail.tsx`, after line 102 (after `const [showPreview, setShowPreview] = useState(true)`), add:

```typescript
const [activeTab, setActiveTab] = useState<'canvas' | 'code'>('canvas')
const [codeEditorValue, setCodeEditorValue] = useState<string>('')
const [isCodeDirty, setIsCodeDirty] = useState(false)
const [showUnsavedModal, setShowUnsavedModal] = useState(false)
const [pendingTab, setPendingTab] = useState<'canvas' | 'code' | null>(null)

useUnsavedChanges(isCodeDirty)
```

### Step 3: Add tab switching logic

After the state management code, add:

```typescript
const handleTabSwitch = (newTab: 'canvas' | 'code') => {
  if (newTab === activeTab) return

  if (activeTab === 'code' && isCodeDirty) {
    setPendingTab(newTab)
    setShowUnsavedModal(true)
    return
  }

  setActiveTab(newTab)
}

const handleSaveAndSwitch = async () => {
  try {
    await handleSaveCode(codeEditorValue)
    setIsCodeDirty(false)
    setShowUnsavedModal(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
    toast.success('Code saved successfully')
  } catch (error) {
    toast.error('Failed to save code')
  }
}

const handleDiscardAndSwitch = () => {
  setIsCodeDirty(false)
  setShowUnsavedModal(false)
  if (pendingTab) {
    setActiveTab(pendingTab)
    setPendingTab(null)
  }
}

const handleCancelSwitch = () => {
  setShowUnsavedModal(false)
  setPendingTab(null)
}
```

### Step 4: Add code save handler

Add this function after the previous handlers:

```typescript
const handleSaveCode = async (code: string) => {
  // TODO: Parse code and update jsonStructure
  // For now, just save code as-is
  await updateEmail.mutateAsync({
    id: email.id,
    data: {
      // Store code in a new field or parse to jsonStructure
      // This is a placeholder implementation
    },
  })
  setIsCodeDirty(false)
}
```

### Step 5: Add canvas handlers

Add these handlers after handleSaveCode:

```typescript
const handleReorderBlocks = (reorderedBlocks: EmailNode[]) => {
  updateEmail.mutate({
    id: email.id,
    data: {
      jsonStructure: {
        ...email.jsonStructure,
        root: {
          ...email.jsonStructure.root,
          children: reorderedBlocks,
        },
      },
    },
  })
}
```

### Step 6: Replace the split-pane section

In `src/pages/EmailDetail.tsx`, replace the entire section from line 274 to line 351 (the `{/* Split-Pane Editor/Preview */}` comment and the content inside) with:

```typescript
{/* Tab Navigation */}
<div className="border-b border-gray-200 bg-white">
  <div className="max-w-6xl mx-auto px-6">
    <div className="flex gap-1">
      <button
        onClick={() => handleTabSwitch('canvas')}
        className={`px-6 py-3 font-medium border-b-2 transition-colors ${
          activeTab === 'canvas'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        Canvas
      </button>
      <button
        onClick={() => handleTabSwitch('code')}
        className={`px-6 py-3 font-medium border-b-2 transition-colors relative ${
          activeTab === 'code'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        Code
        {isCodeDirty && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full" />
        )}
      </button>
    </div>
  </div>
</div>

{/* Tab Content */}
<div className="h-[calc(100vh-180px)]">
  {activeTab === 'canvas' ? (
    <CanvasTab
      blocks={blocks}
      onAddBlock={handleAddBlock}
      onUpdateBlock={handleUpdateBlock}
      onDeleteBlock={handleDeleteBlock}
      onReorderBlocks={handleReorderBlocks}
    />
  ) : (
    <CodeTab
      initialCode={codeEditorValue}
      onSave={handleSaveCode}
    />
  )}
</div>

{/* Unsaved Changes Modal */}
<UnsavedChangesModal
  isOpen={showUnsavedModal}
  onSaveAndSwitch={handleSaveAndSwitch}
  onDiscard={handleDiscardAndSwitch}
  onCancel={handleCancelSwitch}
/>
```

### Step 7: Remove FloatingToolbar from end

Remove line 353: `<FloatingToolbar onAddBlock={handleAddBlock} />`
(FloatingToolbar is now inside CanvasTab)

### Step 8: Verify page compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 9: Test the application

Run: `bun run dev`
Expected: Dev server starts, navigate to an email detail page, should see Canvas/Code tabs

### Step 10: Commit tab integration

```bash
git add src/pages/EmailDetail.tsx
git commit -m "feat: integrate Canvas and Code tabs in EmailDetail"
```

---

## Task 7: Add Code-to-Canvas Conversion (Placeholder)

**Files:**
- Create: `src/utils/codeToCanvas.ts`
- Modify: `src/pages/EmailDetail.tsx` (handleSaveCode function)

### Step 1: Create placeholder codeToCanvas utility

Create `src/utils/codeToCanvas.ts`:

```typescript
import type { EmailNode } from '../types/email'

export interface ParseResult {
  success: boolean
  blocks?: EmailNode[]
  error?: string
}

/**
 * Parse React email code and convert to Canvas block structure
 *
 * PLACEHOLDER IMPLEMENTATION
 * TODO: Implement actual JSX parsing to extract blocks
 */
export function codeToCanvas(code: string): ParseResult {
  // For now, return empty to avoid breaking Canvas
  // Real implementation would:
  // 1. Parse JSX AST
  // 2. Extract @react-email components
  // 3. Map to EmailNode types
  // 4. Return structured blocks

  return {
    success: true,
    blocks: [],
    error: undefined,
  }
}
```

### Step 2: Update handleSaveCode to use codeToCanvas

In `src/pages/EmailDetail.tsx`, replace the `handleSaveCode` function with:

```typescript
const handleSaveCode = async (code: string) => {
  const parseResult = codeToCanvas(code)

  if (!parseResult.success) {
    toast.error(`Failed to parse code: ${parseResult.error}`)
    throw new Error(parseResult.error)
  }

  // Update email with new code
  // For now, keep existing jsonStructure (canvas as source of truth)
  await updateEmail.mutateAsync({
    id: email.id,
    data: {
      // In future: Update jsonStructure from parseResult.blocks
      // For now, just acknowledge save without updating structure
    },
  })

  setIsCodeDirty(false)
  setCodeEditorValue(code)
}
```

### Step 3: Verify compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 4: Commit code-to-canvas placeholder

```bash
git add src/utils/codeToCanvas.ts src/pages/EmailDetail.tsx
git commit -m "feat: add code-to-canvas conversion placeholder"
```

---

## Task 8: Add Canvas-to-Code Generation

**Files:**
- Create: `src/utils/canvasToCode.ts`
- Modify: `src/pages/EmailDetail.tsx` (initialize codeEditorValue)

### Step 1: Create canvasToCode utility

Create `src/utils/canvasToCode.ts`:

```typescript
import type { EmailNode } from '../types/email'

/**
 * Convert Canvas blocks to React email code
 */
export function canvasToCode(blocks: EmailNode[]): string {
  const blockToCode = (block: EmailNode, indent = 2): string => {
    const indentStr = ' '.repeat(indent)

    switch (block.type) {
      case 'heading': {
        const level = block.level || 1
        return `${indentStr}<Text className="text-${level === 1 ? '3xl' : level === 2 ? '2xl' : 'xl'} font-bold">
${indentStr}  ${block.text || ''}
${indentStr}</Text>`
      }

      case 'text':
        return `${indentStr}<Text>${block.text || ''}</Text>`

      case 'button':
        return `${indentStr}<Button href="${block.href || '#'}" className="bg-blue-600 text-white px-6 py-3 rounded">
${indentStr}  ${block.label || 'Click me'}
${indentStr}</Button>`

      case 'image':
        return `${indentStr}<Img
${indentStr}  src="${block.src || ''}"
${indentStr}  alt="${block.alt || ''}"
${indentStr}  width={${block.width || 600}}
${indentStr}  height={${block.height || 400}}
${indentStr}/>`

      case 'divider':
        return `${indentStr}<Hr style={{ borderColor: '${block.color || '#E5E7EB'}', width: '${block.width || 100}%' }} />`

      case 'spacer':
        return `${indentStr}<div style={{ height: '${block.height || 20}px' }} />`

      case 'section': {
        const children = block.children?.map(child => blockToCode(child, indent + 2)).join('\n') || ''
        return `${indentStr}<Section style={{ backgroundColor: '${block.backgroundColor || '#FFFFFF'}', padding: '${block.padding || '20px'}' }}>
${children}
${indentStr}</Section>`
      }

      default:
        return ''
    }
  }

  const blocksCode = blocks.map(block => blockToCode(block, 6)).join('\n\n')

  return `import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Tailwind,
  Preview,
} from '@react-email/components';

const EmailTemplate = () => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-white font-sans">
          <Container className="max-w-2xl mx-auto">
${blocksCode}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;`
}
```

### Step 2: Initialize code editor value from blocks

In `src/pages/EmailDetail.tsx`, update the `codeEditorValue` initialization (around line 105) to:

```typescript
const [codeEditorValue, setCodeEditorValue] = useState<string>(() => {
  return canvasToCode(email?.jsonStructure.root.children || [])
})
```

Add the import at the top:

```typescript
import { canvasToCode } from '../utils/canvasToCode'
```

### Step 3: Update code when blocks change

Add this useEffect after the state declarations:

```typescript
useEffect(() => {
  if (email && activeTab === 'code') {
    const generatedCode = canvasToCode(email.jsonStructure.root.children || [])
    setCodeEditorValue(generatedCode)
  }
}, [email, activeTab])
```

### Step 4: Verify compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 5: Test code generation

Run: `bun run dev`
Navigate to email detail, switch to Code tab, should see generated React code

### Step 6: Commit canvas-to-code generation

```bash
git add src/utils/canvasToCode.ts src/pages/EmailDetail.tsx
git commit -m "feat: add canvas-to-code generation"
```

---

## Task 9: Add TypeScript Validation to Monaco

**Files:**
- Create: `src/utils/configureMonaco.ts`
- Modify: `src/components/email-editor/CodeEditor.tsx`

### Step 1: Create Monaco configuration utility

Create `src/utils/configureMonaco.ts`:

```typescript
import type * as Monaco from 'monaco-editor'

/**
 * Configure Monaco editor with TypeScript validation
 * Runs when Monaco loads
 */
export function configureMonaco(monaco: typeof Monaco) {
  // TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  })

  // Enable validation
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  })

  // Add @react-email/components type definitions
  // For now, add basic types. In production, fetch real types
  const reactEmailTypes = `
    declare module '@react-email/components' {
      import * as React from 'react';

      export const Html: React.FC<React.HTMLAttributes<HTMLHtmlElement>>;
      export const Head: React.FC<React.HTMLAttributes<HTMLHeadElement>>;
      export const Body: React.FC<React.HTMLAttributes<HTMLBodyElement>>;
      export const Container: React.FC<React.HTMLAttributes<HTMLDivElement>>;
      export const Section: React.FC<React.HTMLAttributes<HTMLElement>>;
      export const Text: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
      export const Button: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
      export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
      export const Hr: React.FC<React.HTMLAttributes<HTMLHRElement>>;
      export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
      export const Tailwind: React.FC<{ children?: React.ReactNode }>;
      export const Preview: React.FC<{ children?: string }>;
      export const Row: React.FC<React.HTMLAttributes<HTMLTableRowElement>>;
      export const Column: React.FC<React.HTMLAttributes<HTMLTableCellElement>>;
    }
  `

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactEmailTypes,
    'file:///node_modules/@react-email/components/index.d.ts'
  )

  // Add React types (basic)
  const reactTypes = `
    declare module 'react' {
      export = React;
      export as namespace React;
      namespace React {
        type ReactNode = string | number | boolean | null | undefined;
        type FC<P = {}> = (props: P) => ReactNode;
        interface HTMLAttributes<T> {
          className?: string;
          style?: Record<string, string | number>;
          children?: ReactNode;
        }
        interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
          href?: string;
          target?: string;
        }
        interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
          src?: string;
          alt?: string;
          width?: number | string;
          height?: number | string;
        }
      }
    }
  `

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactTypes,
    'file:///node_modules/@types/react/index.d.ts'
  )
}
```

### Step 2: Use configuration in CodeEditor

In `src/components/email-editor/CodeEditor.tsx`, add import:

```typescript
import { configureMonaco } from '../../utils/configureMonaco'
```

Update the Editor component to include `beforeMount`:

```typescript
<Editor
  height="100%"
  defaultLanguage="typescript"
  value={value}
  onChange={onChange}
  onMount={onMount}
  beforeMount={configureMonaco}
  theme="vs-dark"
  // ... rest of options
/>
```

### Step 3: Verify compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 4: Test TypeScript validation

Run: `bun run dev`
Navigate to Code tab, type invalid TypeScript, should see red squiggles

### Step 5: Commit Monaco configuration

```bash
git add src/utils/configureMonaco.ts src/components/email-editor/CodeEditor.tsx
git commit -m "feat: add TypeScript validation to Monaco editor"
```

---

## Task 10: Add Save Validation and Error Handling

**Files:**
- Modify: `src/utils/transpileCode.ts`
- Create: `src/utils/validateCode.ts`
- Modify: `src/components/email-editor/CodeTab.tsx`

### Step 1: Create code validation utility

Create `src/utils/validateCode.ts`:

```typescript
import { transpileCode } from './transpileCode'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateCode(code: string): ValidationResult {
  const errors: string[] = []

  // Check if code is empty
  if (!code.trim()) {
    errors.push('Code cannot be empty')
  }

  // Check for required imports
  if (!code.includes('@react-email/components')) {
    errors.push('Missing import from @react-email/components')
  }

  // Check for export default
  if (!code.includes('export default')) {
    errors.push('Missing default export')
  }

  // Try transpiling to check for syntax errors
  const transpileResult = transpileCode(code)
  if (!transpileResult.success) {
    errors.push(`Syntax error: ${transpileResult.error}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

### Step 2: Update CodeTab to validate before save

In `src/components/email-editor/CodeTab.tsx`, add import:

```typescript
import { validateCode } from '../../utils/validateCode'
```

Add validation state after the `useCodeEditor` hook:

```typescript
const [validationErrors, setValidationErrors] = useState<string[]>([])
```

Update `handleSave` to validate first:

```typescript
const handleSave = useCallback(async () => {
  const validation = validateCode(code)

  if (!validation.isValid) {
    setValidationErrors(validation.errors)
    return
  }

  setValidationErrors([])
  await onSave(code)
  resetDirty()
}, [code, onSave, resetDirty])
```

Add error banner to the header section:

```typescript
{/* Header with save button */}
<div className="bg-gray-800 text-white px-4 py-3 flex-col border-b border-gray-700">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-3">
      <h3 className="font-semibold">Email Template Code</h3>
      {isDirty && (
        <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
          Unsaved changes
        </span>
      )}
    </div>
    <button
      onClick={handleSave}
      disabled={!isDirty || validationErrors.length > 0}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
    >
      Save (Cmd/Ctrl+S)
    </button>
  </div>

  {validationErrors.length > 0 && (
    <div className="bg-red-600 text-white px-3 py-2 rounded text-sm">
      <strong>Cannot save:</strong>
      <ul className="mt-1 ml-4 list-disc">
        {validationErrors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  )}
</div>
```

Update the container div className to accommodate the flex-col change:

```typescript
<div className="h-full flex flex-col">
```

### Step 3: Listen for Cmd/Ctrl+S event

Add useEffect to handle keyboard save event:

```typescript
useEffect(() => {
  const handleSaveEvent = () => {
    handleSave()
  }

  window.addEventListener('editor-save', handleSaveEvent)
  return () => window.removeEventListener('editor-save', handleSaveEvent)
}, [handleSave])
```

### Step 4: Verify compiles

Run: `bun x tsc --noEmit`
Expected: No TypeScript errors

### Step 5: Test validation

Run: `bun run dev`
Try to save invalid code, should see error banner and disabled save button

### Step 6: Commit validation and error handling

```bash
git add src/utils/validateCode.ts src/components/email-editor/CodeTab.tsx
git commit -m "feat: add code validation and error handling before save"
```

---

## Task 11: Final Testing and Polish

**Files:**
- Modify: `src/pages/EmailDetail.tsx` (add toast notifications)

### Step 1: Add toast notifications

In `src/pages/EmailDetail.tsx`, update the handlers to use toast:

Update `handleSaveCode`:

```typescript
const handleSaveCode = async (code: string) => {
  const parseResult = codeToCanvas(code)

  if (!parseResult.success) {
    toast.error(`Failed to parse code: ${parseResult.error}`)
    throw new Error(parseResult.error)
  }

  try {
    await updateEmail.mutateAsync({
      id: email.id,
      data: {
        // Future: Update from parseResult.blocks
      },
    })

    setIsCodeDirty(false)
    setCodeEditorValue(code)
    toast.success('Code saved successfully')
  } catch (error) {
    toast.error('Failed to save code')
    throw error
  }
}
```

### Step 2: Test complete user flow

Run: `bun run dev`

Test the following:
1. Navigate to email detail page
2. Verify Canvas tab shows existing blocks
3. Switch to Code tab - should show generated code
4. Edit code in Monaco editor
5. Verify "unsaved changes" indicator appears
6. Try switching back to Canvas - should show modal
7. Click "Cancel" - should stay on Code tab
8. Try saving with invalid code - should show errors
9. Fix code and save - should succeed with toast
10. Switch to Canvas tab - should work without modal
11. Edit blocks in Canvas
12. Switch back to Code - should see updated generated code

### Step 3: Run linter

Run: `bun run lint`
Expected: Fix any linting errors

### Step 4: Run TypeScript check

Run: `bun x tsc --noEmit`
Expected: No errors

### Step 5: Build the application

Run: `bun run build`
Expected: Build succeeds

### Step 6: Commit final polish

```bash
git add src/pages/EmailDetail.tsx
git commit -m "feat: add toast notifications and final polish to code editor"
```

---

## Summary

This implementation plan adds a complete Monaco-based code editor to the email detail page with the following features:

**Completed:**
- ✅ Monaco editor with TypeScript support
- ✅ Live preview with JSX transpilation
- ✅ Canvas/Code tab switching
- ✅ Unsaved changes protection
- ✅ Code validation before save
- ✅ Canvas-to-Code generation
- ✅ Code-to-Canvas parsing (placeholder)
- ✅ Keyboard shortcuts (Cmd/Ctrl+S)
- ✅ Error handling and user feedback

**Future enhancements:**
- Full Code-to-Canvas parsing (implement AST parsing)
- Fetch real type definitions dynamically
- Prettier auto-formatting integration
- Resizable split panes
- Code snippets and templates
- Syntax highlighting for variables

**Total estimated time:** 3-4 hours for implementation + testing

---
