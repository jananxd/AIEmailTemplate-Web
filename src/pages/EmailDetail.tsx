import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
import { generateId } from '../lib/utils'

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

  const handleAddBlock = (newBlock: Omit<EmailNode, 'id'>) => {
    const blockWithId = { ...newBlock, id: generateId() } as EmailNode
    const updatedBlocks = [...blocks, blockWithId]
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
            <ArrowLeft className="w-5 h-5" />
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

      {/* Floating Toolbar */}
      <FloatingToolbar onAddBlock={handleAddBlock} />
    </div>
  )
}
