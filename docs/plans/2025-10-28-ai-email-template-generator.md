# AI Email Template Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Build a visual email template builder where users create AI-generated email templates with drag-and-drop blocks, organize them into projects with brand context, and expose a public API for rendering templates with custom variables.

**Architecture:** React SPA with visual block editor (similar to Notion), TanStack Query for data fetching, React Email for rendering, drag-and-drop for component library and email organization. Two main views: generation interface (home) and block editor (email detail). Frontend extracts variables from templates and backend stores them for public API consumption.

**Tech Stack:** React 19, TypeScript, Vite, TailwindCSS, React Router, TanStack Query, React Email, @dnd-kit, Zustand, Lucide React, Framer Motion

---

## Phase 1: Setup & Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
bun add react-email @react-email/components @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react zustand immer react-hook-form framer-motion
```

Expected: Dependencies installed successfully

**Step 2: Install dev dependencies for types**

Run:
```bash
bun add -d @types/node
```

Expected: Dev dependencies installed

**Step 3: Verify installations**

Run:
```bash
bun install
```

Expected: All dependencies resolved

**Step 4: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: install project dependencies for email builder"
```

---

### Task 2: Create Type Definitions

**Files:**
- Create: `src/types/email.ts`
- Create: `src/types/project.ts`
- Create: `src/types/api.ts`

**Step 1: Create email types**

Create `src/types/email.ts`:
```typescript
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
```

**Step 2: Create project types**

Create `src/types/project.ts`:
```typescript
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
```

**Step 3: Create API types**

Create `src/types/api.ts`:
```typescript
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
```

**Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for emails, projects, and API"
```

---

### Task 3: Create API Client

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/lib/config.ts`

**Step 1: Create config file**

Create `src/lib/config.ts`:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'
export const API_TIMEOUT = 30000
```

**Step 2: Create API client**

Create `src/lib/api.ts`:
```typescript
import type {
  Email,
  Project,
  GenerateEmailRequest,
  RenderEmailRequest,
  SendTestEmailRequest,
  UploadedFile,
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
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
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

    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
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
```

**Step 3: Create env example**

Create `.env.example`:
```
VITE_API_BASE_URL=http://localhost:3000/v1
```

**Step 4: Commit**

```bash
git add src/lib/ .env.example
git commit -m "feat: add API client for backend communication"
```

---

### Task 4: Create Utility Functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/variableParser.ts`

**Step 1: Create general utilities**

Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
```

**Step 2: Install missing dependencies**

Run:
```bash
bun add clsx tailwind-merge
```

**Step 3: Create variable parser**

Create `src/lib/variableParser.ts`:
```typescript
/**
 * Extract all variables from text (e.g., "Hello {{name}}" -> ["name"])
 */
export function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const matches = text.matchAll(regex)
  return Array.from(matches, m => m[1])
}

/**
 * Extract all variables from an email JSON structure
 */
export function extractVariablesFromJSON(root: any): string[] {
  const variables = new Set<string>()

  function traverse(node: any) {
    if (!node) return

    // Check text fields
    if (node.text) {
      extractVariables(node.text).forEach(v => variables.add(v))
    }

    // Check label fields (buttons)
    if (node.label) {
      extractVariables(node.label).forEach(v => variables.add(v))
    }

    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  traverse(root)
  return Array.from(variables)
}

/**
 * Replace variables in text with actual values
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] ?? match
  })
}
```

**Step 4: Commit**

```bash
git add src/lib/ package.json bun.lockb
git commit -m "feat: add utility functions and variable parser"
```

---

## Phase 2: Layout & Navigation

### Task 5: Create Layout Components

**Files:**
- Create: `src/components/layout/Layout.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/SidebarHeader.tsx`

**Step 1: Create layout wrapper**

Create `src/components/layout/Layout.tsx`:
```typescript
import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

**Step 2: Create sidebar header**

Create `src/components/layout/SidebarHeader.tsx`:
```typescript
import { useState } from 'react'
import { Menu, X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
            </svg>
            <span className="font-semibold text-lg">EmailAI</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <button
          onClick={() => navigate('/')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>New Email</span>
        </button>
      )}
    </div>
  )
}
```

**Step 3: Create sidebar base**

Create `src/components/layout/Sidebar.tsx`:
```typescript
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home } from 'lucide-react'
import SidebarHeader from './SidebarHeader'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <nav className="p-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Home size={20} />
          {!isCollapsed && <span>Home</span>}
        </NavLink>

        {/* Email list and projects will be added later */}
      </nav>
    </aside>
  )
}
```

**Step 4: Update App to use Layout**

Modify `src/App.tsx`:
```typescript
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import About from './pages/About'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}

export default App
```

**Step 5: Commit**

```bash
git add src/components/layout/ src/App.tsx
git commit -m "feat: add layout with collapsible sidebar"
```

---

## Phase 3: Home Page - Generation Interface

### Task 6: Create Sample Prompts Component

**Files:**
- Create: `src/components/generation/SamplePrompts.tsx`

**Step 1: Create sample prompts component**

Create `src/components/generation/SamplePrompts.tsx`:
```typescript
interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void
}

const SAMPLE_PROMPTS = [
  {
    label: 'Welcome Email',
    prompt: 'Create a warm welcome email for new users signing up to our platform'
  },
  {
    label: 'Product Launch',
    prompt: 'Write a product launch announcement email with excitement and clear call-to-action'
  },
  {
    label: 'Newsletter',
    prompt: 'Create a monthly newsletter template with sections for updates, tips, and news'
  },
  {
    label: 'Password Reset',
    prompt: 'Create a secure password reset email with clear instructions'
  }
]

export default function SamplePrompts({ onSelectPrompt }: SamplePromptsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Sample prompts:</h3>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_PROMPTS.map((sample) => (
          <button
            key={sample.label}
            onClick={() => onSelectPrompt(sample.prompt)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/generation/
git commit -m "feat: add sample prompts component"
```

---

### Task 7: Create Generation Input Component

**Files:**
- Create: `src/components/generation/GenerationInput.tsx`

**Step 1: Create input component**

Create `src/components/generation/GenerationInput.tsx`:
```typescript
import { useState, useRef, FormEvent } from 'react'
import { Paperclip, Send, X } from 'lucide-react'

interface GenerationInputProps {
  onGenerate: (prompt: string, image?: File) => void
  isLoading?: boolean
  defaultPrompt?: string
}

export default function GenerationInput({
  onGenerate,
  isLoading,
  defaultPrompt = ''
}: GenerationInputProps) {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      onGenerate(prompt, attachedImage || undefined)
    }
  }

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAttachedImage(file)
    }
  }

  const removeImage = () => {
    setAttachedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the email you want to create..."
          rows={4}
          className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageAttach}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            title="Attach image"
          >
            <Paperclip size={20} />
          </label>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Generate email"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {attachedImage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Paperclip size={16} className="text-blue-600" />
          <span className="text-sm text-blue-900 flex-1">{attachedImage.name}</span>
          <button
            type="button"
            onClick={removeImage}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </form>
  )
}
```

**Step 2: Update prompt on defaultPrompt change**

This handles when sample prompt is selected. Modify the component to use useEffect:

```typescript
import { useState, useRef, FormEvent, useEffect } from 'react'
// ... rest of imports

export default function GenerationInput({
  onGenerate,
  isLoading,
  defaultPrompt = ''
}: GenerationInputProps) {
  const [prompt, setPrompt] = useState(defaultPrompt)
  // ... rest of state

  useEffect(() => {
    setPrompt(defaultPrompt)
  }, [defaultPrompt])

  // ... rest of component
}
```

**Step 3: Commit**

```bash
git add src/components/generation/
git commit -m "feat: add generation input with image attachment"
```

---

### Task 8: Update Home Page

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Create basic home page structure**

Replace content of `src/pages/Home.tsx`:
```typescript
import { useState } from 'react'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'

export default function Home() {
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (prompt: string, image?: File) => {
    setIsGenerating(true)

    // TODO: Call API to generate email
    console.log('Generating email with prompt:', prompt, 'Image:', image)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsGenerating(false)

    // TODO: Navigate to email detail page
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Create beautiful emails with AI
        </h1>
        <p className="text-lg text-gray-600">
          Describe what you need, and let AI generate professional email templates instantly
        </p>
      </div>

      <div className="space-y-8">
        <SamplePrompts onSelectPrompt={setSelectedPrompt} />

        <GenerationInput
          onGenerate={handleGenerate}
          isLoading={isGenerating}
          defaultPrompt={selectedPrompt}
        />

        {isGenerating && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Generating your email template...</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: implement home page generation interface"
```

---

## Phase 4: TanStack Query Setup

### Task 9: Create Query Hooks for Emails

**Files:**
- Create: `src/hooks/useEmails.ts`

**Step 1: Create email query hooks**

Create `src/hooks/useEmails.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Email, GenerateEmailRequest } from '../types'

export function useEmails(projectId?: string) {
  return useQuery({
    queryKey: ['emails', projectId],
    queryFn: () => api.listEmails({ projectId }),
  })
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: ['emails', id],
    queryFn: () => api.getEmail(id),
    enabled: !!id,
  })
}

export function useGenerateEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GenerateEmailRequest) => api.generateEmail(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      return response.email
    },
  })
}

export function useUpdateEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Email> }) =>
      api.updateEmail(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useDeleteEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useRegenerateEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      prompt,
      attachedImage,
    }: {
      id: string
      prompt: string
      attachedImage?: string
    }) => api.regenerateEmail(id, { prompt, attachedImage }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: ({
      id,
      to,
      variables,
    }: {
      id: string
      to: string
      variables: Record<string, string>
    }) => api.sendTestEmail(id, { to, variables }),
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/
git commit -m "feat: add TanStack Query hooks for email operations"
```

---

### Task 10: Create Query Hooks for Projects

**Files:**
- Create: `src/hooks/useProjects.ts`

**Step 1: Create project query hooks**

Create `src/hooks/useProjects.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Project } from '../types'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.listProjects(),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.getProject(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Project, 'id' | 'emailCount' | 'createdAt' | 'updatedAt'>) =>
      api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      api.updateProject(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, deleteEmails }: { id: string; deleteEmails?: boolean }) =>
      api.deleteProject(id, deleteEmails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/
git commit -m "feat: add TanStack Query hooks for project operations"
```

---

## Phase 5: Email Block Editor Foundation

### Task 11: Create Block Type Definitions

**Files:**
- Create: `src/components/block-editor/types.ts`

**Step 1: Create block editor types**

Create `src/components/block-editor/types.ts`:
```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/block-editor/
git commit -m "feat: add block editor type definitions"
```

---

### Task 12: Create Base Block Component

**Files:**
- Create: `src/components/block-editor/blocks/BaseBlock.tsx`

**Step 1: Create base block wrapper**

Create `src/components/block-editor/blocks/BaseBlock.tsx`:
```typescript
import { ReactNode } from 'react'
import { GripVertical, Settings, Trash2 } from 'lucide-react'
import type { EmailNodeType } from '../../../types'

interface BaseBlockProps {
  id: string
  type: EmailNodeType
  isEditing: boolean
  onEditToggle: () => void
  onDelete: () => void
  onSettings?: () => void
  children: ReactNode
}

const BLOCK_ICONS: Record<EmailNodeType, string> = {
  section: '📦',
  heading: '📝',
  text: '📄',
  button: '🔘',
  image: '🖼️',
  divider: '➖',
  spacer: '🎨',
}

const BLOCK_LABELS: Record<EmailNodeType, string> = {
  section: 'Section',
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  image: 'Image',
  divider: 'Divider',
  spacer: 'Spacer',
}

export default function BaseBlock({
  id,
  type,
  isEditing,
  onEditToggle,
  onDelete,
  onSettings,
  children,
}: BaseBlockProps) {
  return (
    <div
      className={`group relative border rounded-lg transition-all ${
        isEditing
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical size={16} />
        </div>

        <span className="text-sm">{BLOCK_ICONS[type]}</span>
        <span className="text-sm font-medium text-gray-700 flex-1">
          {BLOCK_LABELS[type]}
        </span>

        <div className="flex items-center gap-1">
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          )}

          <button
            onClick={onDelete}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete block"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-4" onClick={onEditToggle}>
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/
git commit -m "feat: add base block component with header and actions"
```

---

### Task 13: Create Heading Block

**Files:**
- Create: `src/components/block-editor/blocks/HeadingBlock.tsx`

**Step 1: Create heading block component**

Create `src/components/block-editor/blocks/HeadingBlock.tsx`:
```typescript
import { useState, useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function HeadingBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  const [text, setText] = useState(block.text || '')
  const [level, setLevel] = useState(block.level || 1)

  useEffect(() => {
    setText(block.text || '')
    setLevel(block.level || 1)
  }, [block.text, block.level])

  const handleSave = () => {
    onUpdate({ text, level })
    onEditToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setText(block.text || '')
      setLevel(block.level || 1)
      onEditToggle()
    }
  }

  const headingClasses = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
  }

  return (
    <BaseBlock
      id={block.id}
      type="heading"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Enter heading text..."
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 text-xs text-gray-500">
            <span>Press Enter to save, Esc to cancel</span>
          </div>
        </div>
      ) : (
        <h1 className={`${headingClasses[level as 1 | 2 | 3]} cursor-text`}>
          {text || 'Click to edit heading...'}
        </h1>
      )}
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/
git commit -m "feat: add heading block with inline editing"
```

---

### Task 14: Create Text Block

**Files:**
- Create: `src/components/block-editor/blocks/TextBlock.tsx`

**Step 1: Create text block component**

Create `src/components/block-editor/blocks/TextBlock.tsx`:
```typescript
import { useState, useEffect, useRef } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function TextBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  const [text, setText] = useState(block.text || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setText(block.text || '')
  }, [block.text])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onUpdate({ text })
    onEditToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setText(block.text || '')
      onEditToggle()
    }
  }

  return (
    <BaseBlock
      id={block.id}
      type="text"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 text-xs text-gray-500">
            <span>Click outside or press Esc to save</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 cursor-text whitespace-pre-wrap">
          {text || 'Click to edit text...'}
        </p>
      )}
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/
git commit -m "feat: add text block with multiline editing"
```

---

### Task 15: Create Button Block

**Files:**
- Create: `src/components/block-editor/blocks/ButtonBlock.tsx`

**Step 1: Create button block component**

Create `src/components/block-editor/blocks/ButtonBlock.tsx`:
```typescript
import { useState, useEffect } from 'react'
import BaseBlock from './BaseBlock'
import type { BlockComponentProps } from '../types'

export default function ButtonBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
  onEditToggle,
}: BlockComponentProps) {
  const [label, setLabel] = useState(block.label || '')
  const [href, setHref] = useState(block.href || '')
  const [target, setTarget] = useState<'_blank' | '_self'>(block.target || '_blank')

  useEffect(() => {
    setLabel(block.label || '')
    setHref(block.href || '')
    setTarget(block.target || '_blank')
  }, [block.label, block.href, block.target])

  const handleSave = () => {
    onUpdate({ label, href, target })
    onEditToggle()
  }

  return (
    <BaseBlock
      id={block.id}
      type="button"
      isEditing={isEditing}
      onEditToggle={onEditToggle}
      onDelete={onDelete}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Click me"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`new-tab-${block.id}`}
              checked={target === '_blank'}
              onChange={(e) => setTarget(e.target.checked ? '_blank' : '_self')}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={`new-tab-${block.id}`} className="text-sm text-gray-700">
              Open in new tab
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="text-center">
          <a
            href={href || '#'}
            target={target}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            {label || 'Button Text'}
          </a>
        </div>
      )}
    </BaseBlock>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/block-editor/blocks/
git commit -m "feat: add button block with URL and target settings"
```

---

## Stopping Point for Plan

This plan is getting very long. I'll create the plan file with the first 15 tasks covering:

✅ Setup & dependencies
✅ Type definitions
✅ API client
✅ Layout & navigation
✅ Home page generation interface
✅ TanStack Query hooks
✅ Basic block editor foundation (Heading, Text, Button blocks)

The remaining tasks would include:
- Image, Divider, Spacer, Section blocks
- Floating toolbar
- Drag & drop functionality
- Email detail page
- Preview rendering with React Email
- Variable management
- Sidebar email/project lists
- Project modals

**Step 3: Save plan and offer execution options**

```bash
git add docs/plans/
git commit -m "docs: add implementation plan for AI email template generator"
```

---

## Testing Strategy

Each component should be tested after implementation:
- Unit tests for utilities (variable parser, etc.)
- Component tests for blocks
- Integration tests for API hooks
- E2E tests for full workflows

## Documentation

Update README.md after Phase 1 completion with:
- Setup instructions
- Development workflow
- Architecture overview
- API integration guide
