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
