interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void
}

const SAMPLE_PROMPTS = [
  {
    label: 'Welcome Email',
    prompt: 'Create a warm welcome email for new users signing up to our platform'
  },
  {
    label: 'Product Launch',
    prompt: 'Write a product launch announcement email with excitement and clear call-to-action'
  },
  {
    label: 'Newsletter',
    prompt: 'Create a monthly newsletter template with sections for updates, tips, and news'
  },
  {
    label: 'Password Reset',
    prompt: 'Create a secure password reset email with clear instructions'
  }
]

export default function SamplePrompts({ onSelectPrompt }: SamplePromptsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Sample prompts:</h3>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_PROMPTS.map((sample) => (
          <button
            key={sample.label}
            onClick={() => onSelectPrompt(sample.prompt)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  )
}
