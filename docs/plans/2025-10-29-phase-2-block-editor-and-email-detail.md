# Phase 2: Block Editor & Email Detail Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Complete the visual block editor with all block types, drag-and-drop functionality, email detail page with live preview, and project management UI.

**Architecture:** Extend the existing block editor foundation with remaining block types (Image, Divider, Spacer, Section), implement dnd-kit for drag-and-drop, create email detail page with Monaco-style block editor and React Email preview, add sidebar lists with drag-drop organization.

**Tech Stack:** React 19, TypeScript, @dnd-kit (already installed), React Email, Framer Motion, existing type system with discriminated unions

---

## Phase 2A: Complete Block Components

### Task 1: Create Image Block

**Files:**
- Create: `src/components/block-editor/blocks/ImageBlock.tsx`

**Step 1: Create image block component**

Create `src/components/block-editor/blocks/ImageBlock.tsx`:
```typescript
import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'
import { api } from '../../../lib/api'

export default function ImageBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (block.type === 'image') {
      setSrc(block.src || '')
      setAlt(block.alt || '')
    }
  }, [block])

  // Type guard after hooks
  if (block.type !== 'image') {
    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setIsUploading(true)
    try {
      const { url } = await api.uploadImage(file)
      setSrc(url)
      onUpdate({ src: url, alt: alt || file.name })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAltChange = (newAlt: string) => {
    setAlt(newAlt)
    onUpdate({ alt: newAlt })
  }

  return (
    <BaseBlock
      type="image"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {!src ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <label className="flex flex-col items-center cursor-pointer">
            <Upload size={32} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to upload image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          {isUploading && (
            <p className="text-sm text-blue-600 text-center mt-2">Uploading...</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg"
          />
          {isEditing ? (
            <input
              type="text"
              value={alt}
              onChange={(e) => handleAltChange(e.target.value)}
              placeholder="Alt text (for accessibility)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-xs text-gray-500 cursor-text" onClick={onEditToggle}>
              Alt: {alt || 'Click to add alt text'}
            </p>
          )}
        </div>
      )}
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/ImageBlock.tsx
git commit -m "feat: add image block with upload functionality"
```

---

### Task 2: Create Divider Block

**Files:**
- Create: `src/components/block-editor/blocks/DividerBlock.tsx`

**Step 1: Create divider block component**

Create `src/components/block-editor/blocks/DividerBlock.tsx`:
```typescript
import { useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function DividerBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  useEffect(() => {
    // Sync with block if needed
  }, [block])

  // Type guard after hooks
  if (block.type !== 'divider') {
    return null
  }

  return (
    <BaseBlock
      type="divider"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      <div className="py-4">
        <hr className="border-gray-300" />
      </div>
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/DividerBlock.tsx
git commit -m "feat: add divider block component"
```

---

### Task 3: Create Spacer Block

**Files:**
- Create: `src/components/block-editor/blocks/SpacerBlock.tsx`

**Step 1: Create spacer block component**

Create `src/components/block-editor/blocks/SpacerBlock.tsx`:
```typescript
import { useState, useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function SpacerBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  const [height, setHeight] = useState(20)

  useEffect(() => {
    if (block.type === 'spacer') {
      setHeight(block.height || 20)
    }
  }, [block])

  // Type guard after hooks
  if (block.type !== 'spacer') {
    return null
  }

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight)
    onUpdate({ height: newHeight })
  }

  return (
    <BaseBlock
      type="spacer"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      <div className="space-y-2">
        <div
          style={{ height: `${height}px` }}
          className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded"
        />
        {isEditing && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Height:</label>
            <input
              type="range"
              min="10"
              max="200"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="10"
              max="200"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">px</span>
          </div>
        )}
      </div>
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/SpacerBlock.tsx
git commit -m "feat: add spacer block with adjustable height"
```

---

### Task 4: Create Section Block

**Files:**
- Create: `src/components/block-editor/blocks/SectionBlock.tsx`

**Step 1: Create section block component (container for nested blocks)**

Create `src/components/block-editor/blocks/SectionBlock.tsx`:
```typescript
import { useState, useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function SectionBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  const [backgroundColor, setBackgroundColor] = useState('')

  useEffect(() => {
    if (block.type === 'section') {
      setBackgroundColor(block.backgroundColor || '#ffffff')
    }
  }, [block])

  // Type guard after hooks
  if (block.type !== 'section') {
    return null
  }

  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color)
    onUpdate({ backgroundColor: color })
  }

  return (
    <BaseBlock
      type="section"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      <div
        style={{ backgroundColor }}
        className="p-6 rounded-lg border-2 border-dashed border-gray-300"
      >
        {isEditing && (
          <div className="mb-4 flex items-center gap-3 bg-white p-2 rounded">
            <label className="text-sm text-gray-700">Background:</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        )}

        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Section container</p>
          <p className="text-xs mt-1">Nested blocks will be added here in future tasks</p>
        </div>
      </div>
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/SectionBlock.tsx
git commit -m "feat: add section block with background color"
```

---

### Task 5: Create Block Index Export

**Files:**
- Create: `src/components/block-editor/blocks/index.ts`

**Step 1: Create barrel export for all blocks**

Create `src/components/block-editor/blocks/index.ts`:
```typescript
export { default as HeadingBlock } from './HeadingBlock'
export { default as TextBlock } from './TextBlock'
export { default as ButtonBlock } from './ButtonBlock'
export { default as ImageBlock } from './ImageBlock'
export { default as DividerBlock } from './DividerBlock'
export { default as SpacerBlock } from './SpacerBlock'
export { default as SectionBlock } from './SectionBlock'
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/index.ts
git commit -m "feat: add block components barrel export"
```

---

## Phase 2B: Floating Toolbar

### Task 6: Create Floating Toolbar Component

**Files:**
- Create: `src/components/block-editor/FloatingToolbar.tsx`

**Step 1: Create toolbar configuration**

Create `src/components/block-editor/FloatingToolbar.tsx`:
```typescript
import { Heading1, Type, Square, Image, Minus, Box, Space } from 'lucide-react'
import type { EmailNodeType } from '../../types/email'
import { generateId } from '../../lib/utils'

interface ToolbarItem {
  id: EmailNodeType
  icon: React.ReactNode
  label: string
  defaultBlock: any
}

const toolbarItems: ToolbarItem[] = [
  {
    id: 'heading',
    icon: <Heading1 size={20} />,
    label: 'Heading',
    defaultBlock: {
      id: generateId(),
      type: 'heading' as const,
      level: 1,
      text: 'Enter heading...',
    },
  },
  {
    id: 'text',
    icon: <Type size={20} />,
    label: 'Text',
    defaultBlock: {
      id: generateId(),
      type: 'text' as const,
      text: 'Enter text...',
    },
  },
  {
    id: 'button',
    icon: <Square size={20} />,
    label: 'Button',
    defaultBlock: {
      id: generateId(),
      type: 'button' as const,
      label: 'Click me',
      href: '#',
      target: '_blank' as const,
    },
  },
  {
    id: 'image',
    icon: <Image size={20} />,
    label: 'Image',
    defaultBlock: {
      id: generateId(),
      type: 'image' as const,
      src: '',
      alt: '',
    },
  },
  {
    id: 'divider',
    icon: <Minus size={20} />,
    label: 'Divider',
    defaultBlock: {
      id: generateId(),
      type: 'divider' as const,
    },
  },
  {
    id: 'spacer',
    icon: <Space size={20} />,
    label: 'Spacer',
    defaultBlock: {
      id: generateId(),
      type: 'spacer' as const,
      height: 20,
    },
  },
  {
    id: 'section',
    icon: <Box size={20} />,
    label: 'Section',
    defaultBlock: {
      id: generateId(),
      type: 'section' as const,
      children: [],
      backgroundColor: '#ffffff',
    },
  },
]

interface FloatingToolbarProps {
  onAddBlock: (block: any) => void
}

export default function FloatingToolbar({ onAddBlock }: FloatingToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-lg px-3 py-2">
        <div className="flex items-center gap-1">
          {toolbarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onAddBlock(item.defaultBlock)}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors group relative"
              title={item.label}
            >
              {item.icon}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/FloatingToolbar.tsx
git commit -m "feat: add floating toolbar with all block types"
```

---

## Phase 2C: Email Detail Page

### Task 7: Create Email Detail Page

**Files:**
- Create: `src/pages/EmailDetail.tsx`

**Step 1: Create email detail page with block editor**

Create `src/pages/EmailDetail.tsx`:
```typescript
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEmail, useUpdateEmail } from '../hooks/useEmails'
import FloatingToolbar from '../components/block-editor/FloatingToolbar'
import {
  HeadingBlock,
  TextBlock,
  ButtonBlock,
  ImageBlock,
  DividerBlock,
  SpacerBlock,
  SectionBlock,
} from '../components/block-editor/blocks'
import type { EmailNode } from '../types/email'

const blockComponents = {
  heading: HeadingBlock,
  text: TextBlock,
  button: ButtonBlock,
  image: ImageBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  section: SectionBlock,
}

export default function EmailDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useEmail(id!)
  const updateEmail = useUpdateEmail()
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading email...</p>
        </div>
      </div>
    )
  }

  if (!data?.email) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-2">Email not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    )
  }

  const email = data.email
  const blocks = email.jsonStructure.root.children || []

  const handleAddBlock = (newBlock: EmailNode) => {
    const updatedBlocks = [...blocks, newBlock]
    updateEmail.mutate({
      id: email.id,
      data: {
        jsonStructure: {
          ...email.jsonStructure,
          root: {
            ...email.jsonStructure.root,
            children: updatedBlocks,
          },
        },
      },
    })
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<EmailNode>) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    )
    updateEmail.mutate({
      id: email.id,
      data: {
        jsonStructure: {
          ...email.jsonStructure,
          root: {
            ...email.jsonStructure.root,
            children: updatedBlocks,
          },
        },
      },
    })
  }

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId)
    updateEmail.mutate({
      id: email.id,
      data: {
        jsonStructure: {
          ...email.jsonStructure,
          root: {
            ...email.jsonStructure.root,
            children: updatedBlocks,
          },
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {email.jsonStructure.meta.subject}
            </h1>
            <p className="text-sm text-gray-500">
              {email.jsonStructure.meta.previewText}
            </p>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {blocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No blocks yet. Use the toolbar below to add content.</p>
            </div>
          ) : (
            blocks.map((block) => {
              const BlockComponent = blockComponents[block.type]
              if (!BlockComponent) return null

              return (
                <BlockComponent
                  key={block.id}
                  block={block}
                  isEditing={editingBlockId === block.id}
                  onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  onDelete={() => handleDeleteBlock(block.id)}
                  onEditToggle={() =>
                    setEditingBlockId(
                      editingBlockId === block.id ? null : block.id
                    )
                  }
                />
              )
            })
          )}
        </div>
      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar onAddBlock={handleAddBlock} />
    </div>
  )
}
```

**Step 2: Add route to App.tsx**

Modify `src/App.tsx`:
```typescript
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import EmailDetail from './pages/EmailDetail'
import About from './pages/About'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/email/:id" element={<EmailDetail />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}

export default App
```

**Step 3: Commit**

```bash
git add src/pages/EmailDetail.tsx src/App.tsx
git commit -m "feat: add email detail page with block editor"
```

---

## Phase 2D: React Email Preview (Simplified)

### Task 8: Create Email Preview Component

**Files:**
- Create: `src/components/email/EmailPreview.tsx`

**Step 1: Create simple HTML preview component**

Note: Full React Email rendering requires server-side rendering. For now, we'll create a simplified preview.

Create `src/components/email/EmailPreview.tsx`:
```typescript
import type { EmailNode } from '../../types/email'
import { substituteVariables } from '../../lib/variableParser'

interface EmailPreviewProps {
  blocks: EmailNode[]
  variables?: Record<string, string>
}

export default function EmailPreview({ blocks, variables = {} }: EmailPreviewProps) {
  const renderBlock = (block: EmailNode): React.ReactNode => {
    switch (block.type) {
      case 'heading': {
        const text = substituteVariables(block.text || '', variables)
        const Tag = `h${block.level || 1}` as keyof JSX.IntrinsicElements
        return <Tag key={block.id} className="font-bold mb-4">{text}</Tag>
      }

      case 'text': {
        const text = substituteVariables(block.text || '', variables)
        return <p key={block.id} className="mb-4">{text}</p>
      }

      case 'button': {
        const label = substituteVariables(block.label || '', variables)
        return (
          <div key={block.id} className="mb-4">
            <a
              href={block.href}
              target={block.target}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {label}
            </a>
          </div>
        )
      }

      case 'image':
        return block.src ? (
          <img
            key={block.id}
            src={block.src}
            alt={block.alt}
            className="max-w-full h-auto mb-4"
          />
        ) : null

      case 'divider':
        return <hr key={block.id} className="my-4 border-gray-300" />

      case 'spacer':
        return <div key={block.id} style={{ height: `${block.height}px` }} />

      case 'section':
        return (
          <div
            key={block.id}
            style={{ backgroundColor: block.backgroundColor }}
            className="p-6 mb-4 rounded-lg"
          >
            {block.children?.map(renderBlock)}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      {blocks.map(renderBlock)}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/email/EmailPreview.tsx
git commit -m "feat: add email preview component with variable substitution"
```

---

## Phase 2E: Drag & Drop (Basic Implementation)

### Task 9: Add Drag & Drop to Block List

**Files:**
- Modify: `src/pages/EmailDetail.tsx`

**Step 1: Install dnd-kit utilities (already installed in Phase 1)**

**Step 2: Update EmailDetail with drag-and-drop**

Modify `src/pages/EmailDetail.tsx` to add drag-and-drop:
```typescript
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEmail, useUpdateEmail } from '../hooks/useEmails'
import FloatingToolbar from '../components/block-editor/FloatingToolbar'
import {
  HeadingBlock,
  TextBlock,
  ButtonBlock,
  ImageBlock,
  DividerBlock,
  SpacerBlock,
  SectionBlock,
} from '../components/block-editor/blocks'
import type { EmailNode } from '../types/email'

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

export default function EmailDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useEmail(id!)
  const updateEmail = useUpdateEmail()
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading email...</p>
        </div>
      </div>
    )
  }

  if (!data?.email) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-2">Email not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    )
  }

  const email = data.email
  const blocks = email.jsonStructure.root.children || []

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex)

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
  }

  const handleAddBlock = (newBlock: EmailNode) => {
    const updatedBlocks = [...blocks, newBlock]
    updateEmail.mutate({
      id: email.id,
      data: {
        jsonStructure: {
          ...email.jsonStructure,
          root: {
            ...email.jsonStructure.root,
            children: updatedBlocks,
          },
        },
      },
    })
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<EmailNode>) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    )
    updateEmail.mutate({
      id: email.id,
      data: {
        jsonStructure: {
          ...email.jsonStructure,
          root: {
            ...email.jsonStructure.root,
            children: updatedBlocks,
          },
        },
      },
    })
  }

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId)
    updateEmail.mutate({
      id: email.id,
      data: {
        jsonStructure: {
          ...email.jsonStructure,
          root: {
            ...email.jsonStructure.root,
            children: updatedBlocks,
          },
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {email.jsonStructure.meta.subject}
            </h1>
            <p className="text-sm text-gray-500">
              {email.jsonStructure.meta.previewText}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
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
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                    onDelete={() => handleDeleteBlock(block.id)}
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

      <FloatingToolbar onAddBlock={handleAddBlock} />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/pages/EmailDetail.tsx
git commit -m "feat: add drag-and-drop reordering for blocks"
```

---

## Remaining Tasks (Outside Current Scope)

The following features are mentioned but require more complex implementation:

- **Sidebar email/project lists with drag-drop** - Requires state management for projects and email organization
- **Project creation/edit modals** - UI for brand context management
- **Split editor/preview view** - Two-column layout with live preview
- **Full React Email rendering** - Server-side rendering for production-ready emails

These will be addressed in Phase 3 of the implementation.

---

## Testing Strategy

After implementing each task:
1. Run `bun run build` to verify TypeScript compilation
2. Run `bun run lint` to check code quality
3. Manually test each block type in the browser
4. Verify drag-and-drop functionality works smoothly

## Summary

This plan completes the block editor foundation with:
- All 7 block types (Heading, Text, Button, Image, Divider, Spacer, Section)
- Floating toolbar for easy block insertion
- Email detail page with full editing capabilities
- Drag-and-drop block reordering
- Basic email preview component

After completing these 9 tasks, you'll have a fully functional visual email builder ready for backend integration!
