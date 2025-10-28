# Phase 3: Sidebar Lists, Projects & Email Organization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Complete the application with sidebar email/project lists, drag-and-drop organization, project management UI with brand context, split-pane editor/preview, and full integration with the backend API.

**Architecture:** Implement sidebar components for emails and projects with dnd-kit for organization, create project modals for brand context management, add split-pane layout for editor/preview, integrate email generation flow with actual API calls.

**Tech Stack:** React 19, TypeScript, @dnd-kit (already installed), React Email, Framer Motion, TanStack Query (already set up)

**Prerequisites:** Phase 1 and Phase 2 must be completed before starting this phase.

---

## Phase 3A: Sidebar Email & Project Lists

### Task 1: Create Email List Component

**Files:**
- Create: `src/components/sidebar/EmailList.tsx`
- Create: `src/components/sidebar/EmailListItem.tsx`

**Step 1: Create email list item component**

Create `src/components/sidebar/EmailListItem.tsx`:
```typescript
import { NavLink } from 'react-router-dom'
import { Mail, Trash2 } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import type { Email } from '../../types/email'

interface EmailListItemProps {
  email: Email
  onDelete: (id: string) => void
}

export default function EmailListItem({ email, onDelete }: EmailListItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (confirm(`Delete email "${email.meta.subject}"?`)) {
      onDelete(email.id)
    }
  }

  return (
    <NavLink
      to={`/email/${email.id}`}
      className={({ isActive }) =>
        `group relative block px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <div className="flex items-start gap-2">
        <Mail size={16} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {email.meta.subject}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(email.createdAt)}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
          title="Delete email"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      </div>
    </NavLink>
  )
}
```

**Step 2: Create email list container**

Create `src/components/sidebar/EmailList.tsx`:
```typescript
import { useEmails, useDeleteEmail } from '../../hooks/useEmails'
import EmailListItem from './EmailListItem'

interface EmailListProps {
  projectId?: string
}

export default function EmailList({ projectId }: EmailListProps) {
  const { data, isLoading } = useEmails(projectId)
  const deleteEmail = useDeleteEmail()

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Loading emails...
      </div>
    )
  }

  const emails = data?.emails || []

  if (emails.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        No emails yet
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {emails.map((email) => (
        <EmailListItem
          key={email.id}
          email={email}
          onDelete={(id) => deleteEmail.mutate(id)}
        />
      ))}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/sidebar/
git commit -m "feat: add email list components for sidebar"
```

---

### Task 2: Create Project List Component

**Files:**
- Create: `src/components/sidebar/ProjectList.tsx`
- Create: `src/components/sidebar/ProjectItem.tsx`

**Step 1: Create project item component**

Create `src/components/sidebar/ProjectItem.tsx`:
```typescript
import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, MoreVertical } from 'lucide-react'
import EmailList from './EmailList'
import type { Project } from '../../types/project'

interface ProjectItemProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
}

export default function ProjectItem({ project, onEdit, onDelete }: ProjectItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div>
      {/* Project Header */}
      <div className="group relative px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          <Folder size={16} className="text-gray-600" />

          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
            {project.name}
          </span>

          <span className="text-xs text-gray-500">
            {project.emailCount}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                  <button
                    onClick={() => {
                      onEdit(project)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete project "${project.name}"?`)) {
                        onDelete(project.id)
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Emails */}
      {isExpanded && (
        <div className="ml-6 mt-1">
          <EmailList projectId={project.id} />
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create project list container**

Create `src/components/sidebar/ProjectList.tsx`:
```typescript
import { useProjects, useDeleteProject } from '../../hooks/useProjects'
import ProjectItem from './ProjectItem'
import type { Project } from '../../types/project'

interface ProjectListProps {
  onEditProject: (project: Project) => void
  onCreateProject: () => void
}

export default function ProjectList({ onEditProject, onCreateProject }: ProjectListProps) {
  const { data, isLoading } = useProjects()
  const deleteProject = useDeleteProject()

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Loading projects...
      </div>
    )
  }

  const projects = data?.projects || []

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">
          Projects
        </h3>
        <button
          onClick={onCreateProject}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          + New
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500">
          No projects yet
        </div>
      ) : (
        projects.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            onEdit={onEditProject}
            onDelete={(id) => deleteProject.mutate({ id, deleteEmails: false })}
          />
        ))
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/sidebar/
git commit -m "feat: add project list components with nested emails"
```

---

### Task 3: Update Sidebar with Lists

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: Update sidebar to include email and project lists**

Replace `src/components/layout/Sidebar.tsx` content:
```typescript
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Mail } from 'lucide-react'
import SidebarHeader from './SidebarHeader'
import EmailList from '../sidebar/EmailList'
import ProjectList from '../sidebar/ProjectList'
import type { Project } from '../../types/project'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleCreateProject = () => {
    setEditingProject(null)
    setShowProjectModal(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 transition-all duration-300">
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        <nav className="p-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center justify-center p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
            title="Home"
          >
            <Home size={20} />
          </NavLink>
        </nav>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen">
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <nav className="flex-1 overflow-y-auto p-4">
        {/* Home Link */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-4 ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        {/* All Emails Section */}
        <div className="mb-6">
          <h3 className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
            <Mail size={14} />
            All Emails
          </h3>
          <EmailList />
        </div>

        {/* Projects Section */}
        <ProjectList
          onEditProject={handleEditProject}
          onCreateProject={handleCreateProject}
        />
      </nav>

      {/* Project Modal - will be implemented in next task */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingProject ? 'Edit Project' : 'Create Project'}
            </h2>
            <p className="text-gray-600 text-sm">
              Project modal implementation coming in next task...
            </p>
            <button
              onClick={() => setShowProjectModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: integrate email and project lists into sidebar"
```

---

## Phase 3B: Project Management UI

### Task 4: Create Brand Context Form Component

**Files:**
- Create: `src/components/project/BrandContextForm.tsx`

**Step 1: Create brand context form**

Create `src/components/project/BrandContextForm.tsx`:
```typescript
import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import type { BrandContext } from '../../types/project'
import { api } from '../../lib/api'

interface BrandContextFormProps {
  initialContext?: BrandContext
  onSubmit: (context: BrandContext) => void
  onCancel: () => void
}

export default function BrandContextForm({
  initialContext,
  onSubmit,
  onCancel,
}: BrandContextFormProps) {
  const [name, setName] = useState(initialContext?.name || '')
  const [description, setDescription] = useState(initialContext?.description || '')
  const [logo, setLogo] = useState(initialContext?.logo || '')
  const [voiceGuidelines, setVoiceGuidelines] = useState(
    initialContext?.voiceGuidelines || ''
  )
  const [primaryColor, setPrimaryColor] = useState(
    initialContext?.colors.primary || '#3B82F6'
  )
  const [secondaryColor, setSecondaryColor] = useState(
    initialContext?.colors.secondary || '#10B981'
  )
  const [accentColor, setAccentColor] = useState(
    initialContext?.colors.accent || '#F59E0B'
  )
  const [isUploading, setIsUploading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setIsUploading(true)
    try {
      const { url } = await api.uploadImage(file)
      setLogo(url)
    } catch (error) {
      console.error('Logo upload failed:', error)
      alert('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Brand name is required')
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      logo,
      voiceGuidelines: voiceGuidelines.trim(),
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brand Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your brand..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo
        </label>
        {logo ? (
          <div className="relative inline-block">
            <img src={logo} alt="Brand logo" className="h-20 w-auto rounded-lg" />
            <button
              type="button"
              onClick={() => setLogo('')}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">
              {isUploading ? 'Uploading...' : 'Click to upload logo'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Voice Guidelines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Voice & Tone Guidelines
        </label>
        <textarea
          value={voiceGuidelines}
          onChange={(e) => setVoiceGuidelines(e.target.value)}
          placeholder="e.g., Friendly, professional, casual. Use active voice and inclusive language."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Brand Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand Colors
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Primary</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Secondary</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Accent</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialContext ? 'Update' : 'Create'} Project
        </button>
      </div>
    </form>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/project/
git commit -m "feat: add brand context form component"
```

---

### Task 5: Create Project Modal Component

**Files:**
- Create: `src/components/project/ProjectModal.tsx`

**Step 1: Create project modal**

Create `src/components/project/ProjectModal.tsx`:
```typescript
import { X } from 'lucide-react'
import BrandContextForm from './BrandContextForm'
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects'
import type { Project, BrandContext } from '../../types/project'

interface ProjectModalProps {
  project?: Project
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const handleSubmit = (brandContext: BrandContext) => {
    if (project) {
      // Update existing project
      updateProject.mutate(
        {
          id: project.id,
          data: {
            name: brandContext.name,
            brandContext,
          },
        },
        {
          onSuccess: () => {
            onClose()
          },
        }
      )
    } else {
      // Create new project
      createProject.mutate(
        {
          name: brandContext.name,
          brandContext,
        },
        {
          onSuccess: () => {
            onClose()
          },
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <BrandContextForm
            initialContext={project?.brandContext}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Update Sidebar to use real ProjectModal**

Modify `src/components/layout/Sidebar.tsx` to import and use the real modal:
```typescript
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Mail } from 'lucide-react'
import SidebarHeader from './SidebarHeader'
import EmailList from '../sidebar/EmailList'
import ProjectList from '../sidebar/ProjectList'
import ProjectModal from '../project/ProjectModal'
import type { Project } from '../../types/project'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleCreateProject = () => {
    setEditingProject(null)
    setShowProjectModal(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectModal(true)
  }

  const handleCloseModal = () => {
    setShowProjectModal(false)
    setEditingProject(null)
  }

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 transition-all duration-300">
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        <nav className="p-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center justify-center p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
            title="Home"
          >
            <Home size={20} />
          </NavLink>
        </nav>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen">
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <nav className="flex-1 overflow-y-auto p-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-4 ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <div className="mb-6">
          <h3 className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
            <Mail size={14} />
            All Emails
          </h3>
          <EmailList />
        </div>

        <ProjectList
          onEditProject={handleEditProject}
          onCreateProject={handleCreateProject}
        />
      </nav>

      {showProjectModal && (
        <ProjectModal
          project={editingProject || undefined}
          onClose={handleCloseModal}
        />
      )}
    </aside>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/project/ src/components/layout/Sidebar.tsx
git commit -m "feat: add project modal with brand context management"
```

---

## Phase 3C: Split-Pane Editor/Preview

### Task 6: Add Split-Pane Layout to Email Detail

**Files:**
- Modify: `src/pages/EmailDetail.tsx`
- Create: `src/components/email/VariablePanel.tsx`

**Step 1: Create variable panel component**

Create `src/components/email/VariablePanel.tsx`:
```typescript
import { useState, useEffect } from 'react'
import { extractVariablesFromJSON } from '../../lib/variableParser'
import type { EmailNode } from '../../types/email'

interface VariablePanelProps {
  blocks: EmailNode[]
  onVariablesChange: (variables: Record<string, string>) => void
}

export default function VariablePanel({ blocks, onVariablesChange }: VariablePanelProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})

  useEffect(() => {
    // Extract all variables from blocks
    const root = { id: 'root', type: 'section' as const, children: blocks }
    const detectedVars = extractVariablesFromJSON(root)

    // Initialize missing variables
    const newVars = { ...variables }
    let hasChanges = false

    detectedVars.forEach((varName) => {
      if (!(varName in newVars)) {
        newVars[varName] = ''
        hasChanges = true
      }
    })

    if (hasChanges) {
      setVariables(newVars)
    }
  }, [blocks])

  const handleChange = (varName: string, value: string) => {
    const updated = { ...variables, [varName]: value }
    setVariables(updated)
    onVariablesChange(updated)
  }

  const varNames = Object.keys(variables)

  if (varNames.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Test Variables
      </h3>
      <div className="space-y-2">
        {varNames.map((varName) => (
          <div key={varName}>
            <label className="block text-xs text-gray-600 mb-1">
              {varName}
            </label>
            <input
              type="text"
              value={variables[varName]}
              onChange={(e) => handleChange(varName, e.target.value)}
              placeholder={`Enter ${varName}...`}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Update EmailDetail with split-pane layout**

Add split-pane layout to `src/pages/EmailDetail.tsx` (replace the editor area section):
```typescript
// ... (keep all existing imports and add these)
import EmailPreview from '../components/email/EmailPreview'
import VariablePanel from '../components/email/VariablePanel'

export default function EmailDetail() {
  // ... (keep all existing state and hooks)
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(true)

  // ... (keep all existing handlers)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... (keep existing header) */}

      {/* Split-Pane Editor/Preview */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left: Block Editor */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {blocks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No blocks yet. Use the toolbar below to add content.</p>
                    </div>
                  ) : (
                    blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isEditing={editingBlockId === block.id}
                        onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                        onDelete={() => handleDeleteBlock(block.id)}
                        onEditToggle={() =>
                          setEditingBlockId(
                            editingBlockId === block.id ? null : block.id
                          )
                        }
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right: Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-200 bg-gray-100 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Hide Preview
                </button>
              </div>

              <VariablePanel
                blocks={blocks}
                onVariablesChange={setTestVariables}
              />

              <EmailPreview
                blocks={blocks}
                variables={testVariables}
              />
            </div>
          </div>
        )}

        {/* Toggle Preview Button (when hidden) */}
        {!showPreview && (
          <button
            onClick={() => setShowPreview(true)}
            className="fixed right-4 top-24 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
          >
            Show Preview
          </button>
        )}
      </div>

      <FloatingToolbar onAddBlock={handleAddBlock} />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/pages/EmailDetail.tsx src/components/email/
git commit -m "feat: add split-pane layout with live preview and variable panel"
```

---

## Phase 3D: Backend Integration

### Task 7: Connect Home Page to Email Generation API

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Update home page to use actual API**

Modify `src/pages/Home.tsx` to integrate with backend:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SamplePrompts from '../components/generation/SamplePrompts'
import GenerationInput from '../components/generation/GenerationInput'
import { useGenerateEmail } from '../hooks/useEmails'
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'

export default function Home() {
  const navigate = useNavigate()
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const generateEmail = useGenerateEmail()
  const { data: projectsData } = useProjects()

  const projects = projectsData?.projects || []

  const handleGenerate = async (prompt: string, imageFile?: File) => {
    try {
      let attachedImage: string | undefined

      // Upload image if provided
      if (imageFile) {
        const { url } = await api.uploadImage(imageFile)
        attachedImage = url
      }

      // Generate email
      generateEmail.mutate(
        {
          prompt,
          projectId: selectedProjectId || undefined,
          attachedImage,
          userId: 'current-user', // TODO: Get from auth context
        },
        {
          onSuccess: (response) => {
            // Navigate to email detail page
            navigate(`/email/${response.email.id}`)
          },
        }
      )
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate email. Please try again.')
    }
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
        {/* Project Selector */}
        {projects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (optional)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No project (standalone email)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <SamplePrompts onSelectPrompt={setSelectedPrompt} />

        <GenerationInput
          onGenerate={handleGenerate}
          isLoading={generateEmail.isPending}
          defaultPrompt={selectedPrompt}
        />

        {generateEmail.isPending && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Generating your email template...</p>
          </div>
        )}

        {generateEmail.isError && (
          <div className="text-center py-4 text-red-600">
            <p>Failed to generate email. Please try again.</p>
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
git commit -m "feat: integrate home page with email generation API"
```

---

## Phase 3E: Final Polish

### Task 8: Add Email Actions (Copy, Download, Send Test)

**Files:**
- Create: `src/components/email/EmailActions.tsx`
- Modify: `src/pages/EmailDetail.tsx`

**Step 1: Create email actions component**

Create `src/components/email/EmailActions.tsx`:
```typescript
import { useState } from 'react'
import { Copy, Download, Send, RotateCw } from 'lucide-react'
import { useSendTestEmail } from '../../hooks/useEmails'
import type { Email } from '../../types/email'

interface EmailActionsProps {
  email: Email
  testVariables: Record<string, string>
}

export default function EmailActions({ email, testVariables }: EmailActionsProps) {
  const [testEmail, setTestEmail] = useState('')
  const [showTestDialog, setShowTestDialog] = useState(false)
  const sendTest = useSendTestEmail()

  const handleCopyHTML = async () => {
    // TODO: Render email to HTML first
    const htmlContent = JSON.stringify(email.jsonStructure, null, 2)
    await navigator.clipboard.writeText(htmlContent)
    alert('Email JSON copied to clipboard!')
  }

  const handleDownload = () => {
    const content = JSON.stringify(email.jsonStructure, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${email.meta.subject.replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSendTest = () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    sendTest.mutate(
      {
        id: email.id,
        to: testEmail,
        variables: testVariables,
      },
      {
        onSuccess: () => {
          alert(`Test email sent to ${testEmail}`)
          setShowTestDialog(false)
          setTestEmail('')
        },
        onError: () => {
          alert('Failed to send test email')
        },
      }
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopyHTML}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Copy JSON"
      >
        <Copy size={16} />
        <span className="text-sm">Copy</span>
      </button>

      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Download JSON"
      >
        <Download size={16} />
        <span className="text-sm">Download</span>
      </button>

      <button
        onClick={() => setShowTestDialog(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Send test email"
      >
        <Send size={16} />
        <span className="text-sm">Send Test</span>
      </button>

      {/* Test Email Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Send Test Email</h3>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTestDialog(false)
                  setTestEmail('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTest}
                disabled={sendTest.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {sendTest.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add actions to EmailDetail**

Modify `src/pages/EmailDetail.tsx` header section to include actions:
```typescript
// Add import
import EmailActions from '../components/email/EmailActions'

// In the header section, add EmailActions after the title
<div className="bg-white border-b border-gray-200 px-6 py-4">
  <div className="max-w-6xl mx-auto">
    <div className="flex items-center gap-4 mb-3">
      <button
        onClick={() => navigate('/')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-900">
          {email.jsonStructure.meta.subject}
        </h1>
        <p className="text-sm text-gray-500">
          {email.jsonStructure.meta.previewText}
        </p>
      </div>
    </div>
    <EmailActions email={email} testVariables={testVariables} />
  </div>
</div>
```

**Step 3: Commit**

```bash
git add src/components/email/ src/pages/EmailDetail.tsx
git commit -m "feat: add email actions (copy, download, send test)"
```

---

### Task 9: Add Loading States and Error Handling

**Files:**
- Create: `src/components/common/LoadingSpinner.tsx`
- Create: `src/components/common/ErrorMessage.tsx`

**Step 1: Create reusable loading spinner**

Create `src/components/common/LoadingSpinner.tsx`:
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
    </div>
  )
}
```

**Step 2: Create error message component**

Create `src/components/common/ErrorMessage.tsx`:
```typescript
import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <p className="text-gray-900 font-medium mb-2">Something went wrong</p>
      <p className="text-gray-600 text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/common/
git commit -m "feat: add reusable loading and error components"
```

---

## Summary

Phase 3 implementation includes **9 tasks** that complete the application:

**Phase 3A: Sidebar Lists (Tasks 1-3)**
- Email list with delete functionality
- Project list with nested emails and expand/collapse
- Updated sidebar with integrated lists

**Phase 3B: Project Management (Tasks 4-5)**
- Brand context form with all fields
- Project modal for create/edit operations

**Phase 3C: Split-Pane Layout (Task 6)**
- Side-by-side editor and preview
- Variable panel for test data
- Toggle preview visibility

**Phase 3D: Backend Integration (Task 7)**
- Connected home page to generation API
- Project selection for brand context
- Image upload integration

**Phase 3E: Final Polish (Tasks 8-9)**
- Email actions (copy, download, send test)
- Reusable loading and error components

After completing Phase 3, the application will be fully functional and ready for production use!
