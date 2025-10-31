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

  // Get in-progress generations
  const generations = useGenerationStore((state) =>
    Array.from(state.generations.values())
  )

  // Create phantom emails for in-progress generations
  const phantomEmails = generations
    .filter(gen => gen.status === 'generating')
    .map(gen => createPhantomEmail(gen))

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
