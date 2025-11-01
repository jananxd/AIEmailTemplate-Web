export interface Email {
  id: string
  meta: EmailMeta
  jsxSource: string
  propsSchema: PropSchema
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

export interface PropSchema {
  [propName: string]: {
    type: string
    required: boolean
  }
}
