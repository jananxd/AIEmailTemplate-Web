import type {
  Email,
  Project,
  GenerateEmailRequest,
  SendTestEmailRequest,
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
    if (params?.projectId) searchParams.set('projectId', params.projectId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())

    const query = searchParams.toString()
    const json: any = await this.request(`/emails${query ? `?${query}` : ''}`)
    return {
      emails: json.emails.map(transformEmailResponse),
      pagination: json.pagination,
    }
  }

  async getEmail(id: string): Promise<{ email: Email }> {
    const email: any = await this.request(`/emails/${id}`)
    return { email: transformEmailResponse(email) }
  }

  async updateEmail(id: string, data: Partial<Email>): Promise<{ email: Email }> {
    return this.request(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEmail(id: string): Promise<void> {
    return this.request(`/emails/${id}`, {
      method: 'DELETE',
    })
  }

  async regenerateEmail(
    id: string,
    data: { prompt: string; attachedImage?: string }
  ): Promise<{ email: Email }> {
    const json: any = await this.request(`/emails/${id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { email: transformEmailResponse(json.email) }
  }

  async sendTestEmail(
    id: string,
    data: SendTestEmailRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/emails/${id}/send-test`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Project endpoints
  async createProject(data: Omit<Project, 'id' | 'emailCount' | 'createdAt' | 'updatedAt'>): Promise<{ project: Project }> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
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

  async getProject(id: string): Promise<{ project: Project }> {
    return this.request(`/projects/${id}`)
  }

  async updateProject(id: string, data: Partial<Project>): Promise<{ project: Project }> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string, deleteEmails = false): Promise<void> {
    return this.request(`/projects/${id}?deleteEmails=${deleteEmails}`, {
      method: 'DELETE',
    })
  }

  // Upload endpoints
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }

    const response = await fetch(`${this.baseURL}/uploads/image`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw await response.json()
    }

    return response.json()
  }
}

export const api = new ApiClient(API_BASE_URL)
