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
