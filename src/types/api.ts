export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export interface UploadedFile {
  url: string
  width: number
  height: number
  size: number
  mimeType: string
}

export interface GenerateEmailRequest {
  prompt: string
  projectId?: string
  attachedImage?: string
  userId: string
}

export interface RenderEmailRequest {
  variables: Record<string, string>
}

export interface SendTestEmailRequest {
  to: string
  variables: Record<string, string>
}
