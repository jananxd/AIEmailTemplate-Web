import { useMemo } from 'react'
import { useEmails, useDeleteEmail } from '../../hooks/useEmails'
import EmailListItem from './EmailListItem'
import { useGenerationStore } from '../../store/generationStore'
import { createPhantomEmail } from '../../lib/phantomEmailFactory'

interface EmailListProps {
  projectId?: string
}

export default function EmailList({ projectId }: EmailListProps) {
  const { data, isLoading } = useEmails(projectId)
  const deleteEmail = useDeleteEmail()

  // Get in-progress generation IDs only (stable primitive values)
  // This prevents infinite loop by returning a stable string instead of new arrays/objects
  const inProgressIds = useGenerationStore((state) => {
    const generating = Array.from(state.generations.values())
      .filter(gen => gen.status === 'generating')
      .map(gen => gen.id)
    // Return a stable string representation for comparison
    return generating.join(',')
  })

  // Create phantom emails for in-progress generations
  // Fetch data directly from store to avoid subscribing to Map reference
  const phantomEmails = useMemo(() => {
    if (!inProgressIds) return []
    const ids = inProgressIds.split(',').filter(Boolean)
    const store = useGenerationStore.getState()
    return ids
      .map(id => store.generations.get(id))
      .filter((gen): gen is NonNullable<typeof gen> => gen !== undefined)
      .map(gen => createPhantomEmail(gen))
  }, [inProgressIds])

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Loading emails...
      </div>
    )
  }

  const emails = data?.emails || []

  // Merge phantom emails with real emails (phantoms first for visibility)
  const allEmails = [...phantomEmails, ...emails]

  if (allEmails.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        No emails yet
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {allEmails.map((email) => (
        <EmailListItem
          key={email.id}
          email={email}
          onDelete={(id) => deleteEmail.mutate(id)}
        />
      ))}
    </div>
  )
}
