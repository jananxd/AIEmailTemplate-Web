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
