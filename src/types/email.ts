export interface Email {
  id: string
  meta: EmailMeta
  jsonStructure: EmailJSON
  variables: string[]
  prompt: string
  attachedImage?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface EmailMeta {
  subject: string
  previewText: string
}

export interface EmailJSON {
  meta: EmailMeta
  root: EmailNode
  version: number
}

export type EmailNodeType =
  | 'section'
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'

// Base interface with common properties
interface BaseEmailNode {
  id: string
  children?: EmailNode[]
}

// Section node
export interface SectionNode extends BaseEmailNode {
  type: 'section'
  backgroundColor?: string
  padding?: string
  borderRadius?: string
}

// Heading node
export interface HeadingNode extends BaseEmailNode {
  type: 'heading'
  level?: 1 | 2 | 3
  text?: string
}

// Text node
export interface TextNode extends BaseEmailNode {
  type: 'text'
  text?: string
}

// Button node
export interface ButtonNode extends BaseEmailNode {
  type: 'button'
  label?: string
  href?: string
  target?: '_blank' | '_self'
}

// Image node
export interface ImageNode extends BaseEmailNode {
  type: 'image'
  src?: string
  alt?: string
  width?: number
  height?: number
}

// Divider node
export interface DividerNode extends BaseEmailNode {
  type: 'divider'
  color?: string
  thickness?: number
  width?: number
}

// Spacer node
export interface SpacerNode extends BaseEmailNode {
  type: 'spacer'
  height?: number
}

// Union type of all node types
export type EmailNode =
  | SectionNode
  | HeadingNode
  | TextNode
  | ButtonNode
  | ImageNode
  | DividerNode
  | SpacerNode
