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
