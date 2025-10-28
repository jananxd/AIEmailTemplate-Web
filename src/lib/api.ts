import type {
  Email,
  Project,
  GenerateEmailRequest,
  SendTestEmailRequest,
  PaginatedResponse
} from '../types'
import { API_BASE_URL } from './config'

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
  async generateEmail(data: GenerateEmailRequest): Promise<{ email: Email }> {
    return this.request('/emails/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
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
    return this.request(`/emails${query ? `?${query}` : ''}`)
  }

  async getEmail(id: string): Promise<{ email: Email }> {
    return this.request(`/emails/${id}`)
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
    return this.request(`/emails/${id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
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
