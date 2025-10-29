import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface GenerationProgressProps {
  step: string
  message: string
  status: 'loading' | 'success' | 'error'
  onCancel?: () => void
}

const STEP_LABELS: Record<string, string> = {
  validating: 'Validating',
  loading_brand: 'Loading Brand Settings',
  analyzing_image: 'Analyzing Reference',
  generating: 'Generating Email',
  saving: 'Saving Email',
  error: 'Error',
}

export default function GenerationProgress({
  step,
  message,
  status,
  onCancel,
}: GenerationProgressProps) {
  const steps = [
    'validating',
    'loading_brand',
    'analyzing_image',
    'generating',
    'saving',
  ]

  const currentStepIndex = steps.indexOf(step)

  return (
    <div className="space-y-6 py-8">
      {/* Status Icon */}
      <div className="flex justify-center">
        {status === 'loading' && (
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-16 h-16 text-green-600" />
        )}
        {status === 'error' && (
          <XCircle className="w-16 h-16 text-red-600" />
        )}
      </div>

      {/* Current Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">
          {STEP_LABELS[step] || 'Processing'}
        </p>
        <p className="text-sm text-gray-600 mt-1">{message}</p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const isComplete = index < currentStepIndex
            const isCurrent = s === step

            return (
              <div key={s} className="flex-1 flex items-center">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${
                      isComplete ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Labels */}
        <div className="flex items-start justify-between mt-2">
          {steps.map((s) => (
            <div key={s} className="flex-1 text-center">
              <p className="text-xs text-gray-500 px-1">
                {STEP_LABELS[s] || s}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Button */}
      {status === 'loading' && onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel Generation
          </button>
        </div>
      )}
    </div>
  )
}
