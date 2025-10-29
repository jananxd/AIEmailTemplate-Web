import type {
  Email,
  Project,
  GenerateEmailRequest,
  PaginatedResponse
} from '../types'
import { API_BASE_URL } from './config'

// Transform backend snake_case response to frontend camelCase Email type
function transformEmailResponse(backendEmail: any): Email {
  return {
    id: backendEmail.id,
    meta: {
      subject: backendEmail.subject || '',
      previewText: backendEmail.preview || '',
    },
    jsonStructure: backendEmail.json_state,
    variables: backendEmail.variables || [],
    prompt: backendEmail.prompt || '',
    attachedImage: backendEmail.attached_image,
    projectId: backendEmail.project_id,
    createdAt: backendEmail.created_at,
    updatedAt: backendEmail.updated_at,
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'UnknownError',
        message: 'An unknown error occurred',
      }))
      throw error
    }

    return response.json()
  }

  // Email endpoints
  async generateEmail(data: GenerateEmailRequest): Promise<{ email: Email; generated?: boolean }> {
    const formData = new FormData()
    formData.append('prompt', data.prompt)

    if (data.projectId) {
      formData.append('project_id', data.projectId)
    }

    if (data.attachedImage) {
      formData.append('attached_image', data.attachedImage)
    }

    if (data.userId) {
      formData.append('user_id', data.userId)
    }

    // For FormData, we need to remove Content-Type header (browser sets it with boundary)
    const headers: HeadersInit = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }

    const response = await fetch(`${this.baseURL}/emails/generate`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'UnknownError',
        message: 'An unknown error occurred',
      }))
      throw error
    }

    const json = await response.json()
    return {
      email: transformEmailResponse(json.email),
      generated: json.generated,
    }
  }

  async listEmails(params?: {
    projectId?: string
    limit?: number
    offset?: number
  }): Promise<{ emails: Email[]; pagination: PaginatedResponse<Email>['pagination'] }> {
    const searchParams = new URLSearchParams()
    if (params?.projectId) searchParams.set('project_id', params.projectId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    const json: any = await this.request(`/emails${query ? `?${query}` : ''}`)
    return {
      emails: json.emails.map(transformEmailResponse),
      pagination: json.pagination,
    }
  }

  async getEmail(id: string): Promise<Email> {
    const email: any = await this.request(`/emails/${id}`)
    return transformEmailResponse(email)
  }

  async updateEmail(id: string, data: Partial<Email>): Promise<{ email: Email }> {
    return this.request(`/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteEmail(id: string): Promise<void> {
    return this.request(`/emails/${id}`, {
      method: 'DELETE',
    })
  }

  async sendTestEmail(
    id: string,
    data: { to: string; variables: Record<string, string> }
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/emails/${id}/test-send`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_email: data.to,
        variables: data.variables,
      }),
    })
  }

  // Project endpoints
  async createProject(data: {
    name: string
    description?: string
    brandSettings?: Record<string, any>
    exampleImages?: File[]
  }): Promise<Project> {
    const formData = new FormData()
    formData.append('name', data.name)

    if (data.description) {
      formData.append('description', data.description)
    }

    if (data.brandSettings) {
      formData.append('brand_settings', JSON.stringify(data.brandSettings))
    }

    if (data.exampleImages) {
      data.exampleImages.forEach(file => {
        formData.append('example_images', file)
      })
    }

    const headers: HeadersInit = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }

    const response = await fetch(`${this.baseURL}/projects`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'UnknownError',
        message: 'An unknown error occurred',
      }))
      throw error
    }

    const json = await response.json()
    return json.project
  }

  async listProjects(params?: {
    limit?: number
    offset?: number
  }): Promise<{ projects: Project[]; pagination: PaginatedResponse<Project>['pagination'] }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    return this.request(`/projects${query ? `?${query}` : ''}`)
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/projects/${id}`)
  }

  async updateProject(id: string, data: Partial<Project>): Promise<{ project: Project }> {
    return this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string, deleteEmails = false): Promise<void> {
    return this.request(`/projects/${id}?deleteEmails=${deleteEmails}`, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
