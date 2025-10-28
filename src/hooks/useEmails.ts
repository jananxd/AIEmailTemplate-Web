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
    onSuccess: (_response, variables) => {
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
