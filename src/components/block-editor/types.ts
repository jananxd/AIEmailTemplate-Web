import type { EmailNode } from '../../types'

export interface BlockComponentProps {
  block: EmailNode
  isEditing: boolean
  onUpdate: (updates: Partial<EmailNode>) => void
  onDelete: () => void
  onEditToggle: () => void
}

export interface ToolbarItem {
  id: string
  icon: React.ReactNode
  label: string
  shortcut: string
  defaultBlock: Omit<EmailNode, 'id'>
}
