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
