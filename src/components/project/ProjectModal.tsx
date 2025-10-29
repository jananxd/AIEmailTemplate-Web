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
