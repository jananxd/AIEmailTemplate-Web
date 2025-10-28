export interface Project {
  id: string
  name: string
  brandContext: BrandContext
  emails?: string[]
  emailCount: number
  createdAt: string
  updatedAt: string
}

export interface BrandContext {
  name: string
  description: string
  logo?: string
  voiceGuidelines: string
  colors: {
    primary: string
    secondary: string
    accent?: string
  }
}
