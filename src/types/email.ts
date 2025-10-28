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

export interface EmailNode {
  id: string
  type: EmailNodeType
  children?: EmailNode[]

  // Heading properties
  level?: 1 | 2 | 3

  // Text/Heading properties
  text?: string

  // Button properties
  label?: string
  href?: string
  target?: '_blank' | '_self'

  // Image properties
  src?: string
  alt?: string
  width?: number
  height?: number

  // Spacer properties
  height?: number

  // Section properties
  backgroundColor?: string
  padding?: string
  borderRadius?: string
}
