import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from './useAuth'
import type { Email, GenerateEmailRequest } from '../types'

export function useEmails(projectId?: string) {
  const { loading } = useAuth()

  return useQuery({
    queryKey: ['emails', projectId],
    queryFn: () => api.listEmails({ projectId }),
    enabled: !loading,
  })
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: ['emails', id],
    queryFn: () => api.getEmail(id),
    enabled: !!id,
    retry: false, // Don't retry 404s - email might be generating
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
    onSuccess: (_response, variables) => {
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
