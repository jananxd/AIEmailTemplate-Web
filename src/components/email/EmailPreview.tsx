import type { EmailNode } from '../../types/email'
import EmailIframeRenderer from '../email-editor/EmailIframeRenderer'

interface EmailPreviewProps {
  blocks: EmailNode[]
  variables?: Record<string, string>
}

export default function EmailPreview({ blocks, variables = {} }: EmailPreviewProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <EmailIframeRenderer blocks={blocks} variables={variables} />
    </div>
  )
}
